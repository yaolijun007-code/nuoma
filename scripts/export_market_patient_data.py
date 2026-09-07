#!/usr/bin/env python3
"""Export the minimum patient-history dataset for the internal market app.

The source SQLite database is always opened in read-only mode. The output may
contain personal and health information and must stay outside Git.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def text(value: Any) -> str:
    return str(value or "").strip()


def iso_date(value: Any) -> str:
    candidate = text(value)[:10]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", candidate):
        return ""
    try:
        datetime.strptime(candidate, "%Y-%m-%d")
    except ValueError:
        return ""
    return candidate


def normalized_phone(value: Any) -> str:
    return re.sub(r"\s+", "", text(value))


def write_jsonl(path: Path, records: Iterable[dict[str, Any]]) -> int:
    count = 0
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")
            count += 1
    return count


def export_data(source: Path | str, output: Path | str) -> dict[str, Any]:
    source_path = Path(source).expanduser().resolve()
    output_path = Path(output).expanduser().resolve()
    if not source_path.is_file():
        raise FileNotFoundError(f"source database does not exist: {source_path}")
    output_path.mkdir(parents=True, exist_ok=True)
    source_hash_before = sha256(source_path)

    connection = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        raw_patients = [dict(row) for row in connection.execute(
            """
            SELECT id, patient_code, name, sex, age, phone,
                   summary_main_disease, identity_risk, identity_note
            FROM patients ORDER BY id
            """
        )]
        raw_encounters = [dict(row) for row in connection.execute(
            """
            SELECT id, encounter_key, patient_id, hospital_no,
                   admission_datetime, discharge_datetime, ward, department,
                   admission_diagnosis, discharge_diagnosis
            FROM encounters ORDER BY patient_id, admission_datetime, id
            """
        )]
        raw_diagnoses = [dict(row) for row in connection.execute(
            """
            SELECT patient_id, diagnosis, count, last_date
            FROM diagnosis_stats ORDER BY patient_id, count DESC, last_date DESC
            """
        )]
    finally:
        connection.close()

    patient_ids = {int(patient["id"]) for patient in raw_patients}
    orphan_encounters = [row for row in raw_encounters if int(row["patient_id"]) not in patient_ids]
    orphan_diagnoses = [row for row in raw_diagnoses if int(row["patient_id"]) not in patient_ids]
    if orphan_encounters or orphan_diagnoses:
        raise ValueError("source contains patient-history rows without a valid patient")

    name_counts = Counter(text(patient["name"]) for patient in raw_patients if text(patient["name"]))
    phone_counts = Counter(normalized_phone(patient["phone"]) for patient in raw_patients if normalized_phone(patient["phone"]))
    hospital_patients: dict[str, set[int]] = defaultdict(set)
    encounters_by_patient: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for encounter in raw_encounters:
        patient_id = int(encounter["patient_id"])
        encounters_by_patient[patient_id].append(encounter)
        hospital_no = text(encounter["hospital_no"])
        if hospital_no:
            hospital_patients[hospital_no].add(patient_id)

    exported_encounters: list[dict[str, Any]] = []
    for patient_id in sorted(encounters_by_patient):
        rows = encounters_by_patient[patient_id]
        for sequence, encounter in enumerate(rows, start=1):
            main_diagnosis = text(encounter["discharge_diagnosis"]) or text(encounter["admission_diagnosis"])
            exported_encounters.append({
                "encounterId": text(encounter["encounter_key"]) or f"E-{encounter['id']}",
                "patientId": f"P-{patient_id}",
                "admissionDate": iso_date(encounter["admission_datetime"]),
                "dischargeDate": iso_date(encounter["discharge_datetime"]),
                "department": text(encounter["department"]) or text(encounter["ward"]),
                "mainDiagnosis": main_diagnosis,
                "sequence": sequence,
            })

    exported_patients: list[dict[str, Any]] = []
    for patient in raw_patients:
        source_id = int(patient["id"])
        patient_encounters = encounters_by_patient.get(source_id, [])
        latest = patient_encounters[-1] if patient_encounters else None
        latest_hospital_no = ""
        for encounter in patient_encounters:
            if text(encounter["hospital_no"]):
                latest_hospital_no = text(encounter["hospital_no"])
        reasons: list[str] = []
        name = text(patient["name"])
        phone = normalized_phone(patient["phone"])
        if name_counts[name] > 1:
            reasons.append("存在同名患者")
        if phone and phone_counts[phone] > 1:
            reasons.append("联系电话关联多个患者")
        if latest_hospital_no and len(hospital_patients[latest_hospital_no]) > 1:
            reasons.append("住院号关联多个患者")
        source_risk = text(patient["identity_risk"])
        source_note = text(patient["identity_note"])
        if source_risk and source_risk not in {"正常", "无", "否"}:
            reasons.append(source_note or source_risk)
        reasons = list(dict.fromkeys(reason for reason in reasons if reason))
        latest_diagnosis = ""
        if latest:
            latest_diagnosis = text(latest["discharge_diagnosis"]) or text(latest["admission_diagnosis"])
        exported_patients.append({
            "patientId": f"P-{source_id}",
            "patientCode": text(patient["patient_code"]),
            "name": name,
            "sex": text(patient["sex"]),
            "age": int(patient["age"]) if patient["age"] is not None else None,
            "phone": phone,
            "hospitalNo": latest_hospital_no,
            "admissionCount": len(patient_encounters),
            "identityRisk": bool(reasons),
            "identityRiskReasons": reasons,
            "latestAdmissionDate": iso_date(latest["admission_datetime"]) if latest else "",
            "latestDischargeDate": iso_date(latest["discharge_datetime"]) if latest else "",
            "latestDiagnosis": latest_diagnosis or text(patient["summary_main_disease"]),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        })

    exported_diagnoses = [{
        "patientId": f"P-{int(row['patient_id'])}",
        "diagnosis": text(row["diagnosis"]),
        "count": max(0, int(row["count"] or 0)),
        "lastAdmissionDate": iso_date(row["last_date"]),
    } for row in raw_diagnoses]

    output_files = {
        "patients.jsonl": exported_patients,
        "encounters.jsonl": exported_encounters,
        "diagnosis_stats.jsonl": exported_diagnoses,
    }
    counts = {
        "patients": len(exported_patients),
        "encounters": len(exported_encounters),
        "diagnosisStats": len(exported_diagnoses),
    }
    for filename, records in output_files.items():
        write_jsonl(output_path / filename, records)

    source_hash_after = sha256(source_path)
    if source_hash_before != source_hash_after:
        raise RuntimeError("source database changed during export")
    manifest = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceSha256": source_hash_before,
        "counts": counts,
        "quality": {
            "identityRiskPatients": sum(1 for patient in exported_patients if patient["identityRisk"]),
            "missingPhones": sum(1 for patient in exported_patients if not patient["phone"]),
            "missingDischargeDates": sum(1 for encounter in exported_encounters if not encounter["dischargeDate"]),
        },
        "files": {filename: sha256(output_path / filename) for filename in output_files},
    }
    (output_path / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the minimum market patient-history dataset")
    parser.add_argument("--source", required=True, type=Path, help="read-only source SQLite database")
    parser.add_argument("--output", required=True, type=Path, help="private output directory outside Git")
    arguments = parser.parse_args()
    manifest = export_data(arguments.source, arguments.output)
    counts = manifest["counts"]
    print(f"patients={counts['patients']} encounters={counts['encounters']} diagnosisStats={counts['diagnosisStats']}")
    print("files=patients.jsonl,encounters.jsonl,diagnosis_stats.jsonl,manifest.json")


if __name__ == "__main__":
    main()
