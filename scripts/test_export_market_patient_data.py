import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts.export_market_patient_data import export_data


class MarketPatientExportTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / "source.db"
        connection = sqlite3.connect(self.source)
        connection.executescript(
            """
            CREATE TABLE patients(
              id INTEGER PRIMARY KEY, patient_code TEXT, name TEXT, sex TEXT, age INTEGER,
              phone TEXT, summary_main_disease TEXT, identity_risk TEXT, identity_note TEXT
            );
            CREATE TABLE encounters(
              id INTEGER PRIMARY KEY, encounter_key TEXT, patient_id INTEGER, hospital_no TEXT,
              admission_datetime TEXT, discharge_datetime TEXT, ward TEXT, department TEXT,
              admission_diagnosis TEXT, discharge_diagnosis TEXT
            );
            CREATE TABLE diagnosis_stats(
              patient_id INTEGER, diagnosis TEXT, count INTEGER, last_date TEXT
            );
            """
        )
        connection.executemany(
            "INSERT INTO patients VALUES(?,?,?,?,?,?,?,?,?)",
            [
                (1, "A001", "张三", "男", 62, "13800138000", "腹胀", "正常", ""),
                (2, "A002", "张三", "女", 58, "13900139000", "慢性胃炎", "需核对", "历史身份记录需核对"),
            ],
        )
        connection.executemany(
            "INSERT INTO encounters VALUES(?,?,?,?,?,?,?,?,?,?)",
            [
                (1, "E-1", 1, "H001", "2025-01-02 08:00", "2025-01-05 09:00", "一病区", "内科", "腹胀", "腹胀"),
                (2, "E-2", 1, "H001", "2026-05-02 08:00", "2026-05-08 09:00", "一病区", "消化内科", "腹胀", "腹胀"),
                (3, "E-3", 2, "H002", "2026-06-01 08:00", None, "二病区", "内科", "慢性胃炎", ""),
            ],
        )
        connection.executemany(
            "INSERT INTO diagnosis_stats VALUES(?,?,?,?)",
            [(1, "腹胀", 2, "2026-05-02"), (2, "慢性胃炎", 1, "2026-06-01")],
        )
        connection.commit()
        connection.close()

    def tearDown(self):
        self.temp.cleanup()

    def read_jsonl(self, name):
        return [json.loads(line) for line in (self.root / "out" / name).read_text(encoding="utf-8").splitlines()]

    def test_exports_only_the_minimum_market_dataset(self):
        manifest = export_data(self.source, self.root / "out")
        self.assertEqual(manifest["counts"], {"patients": 2, "encounters": 3, "diagnosisStats": 2})
        patients = self.read_jsonl("patients.jsonl")
        encounters = self.read_jsonl("encounters.jsonl")
        self.assertEqual(patients[0]["admissionCount"], 2)
        self.assertEqual(patients[0]["latestAdmissionDate"], "2026-05-02")
        self.assertEqual(patients[0]["hospitalNo"], "H001")
        self.assertEqual(encounters[0]["patientId"], "P-1")
        self.assertNotIn("totalCost", json.dumps(encounters))
        self.assertNotIn("address", json.dumps(patients))

    def test_marks_duplicate_names_and_source_identity_risks_without_merging(self):
        export_data(self.source, self.root / "out")
        patients = self.read_jsonl("patients.jsonl")
        self.assertEqual([patient["patientId"] for patient in patients], ["P-1", "P-2"])
        self.assertTrue(patients[0]["identityRisk"])
        self.assertIn("存在同名患者", patients[0]["identityRiskReasons"])
        self.assertIn("历史身份记录需核对", patients[1]["identityRiskReasons"])

    def test_manifest_proves_the_source_was_not_changed(self):
        before = self.source.read_bytes()
        manifest = export_data(self.source, self.root / "out")
        self.assertEqual(self.source.read_bytes(), before)
        self.assertEqual(len(manifest["sourceSha256"]), 64)
        self.assertEqual(set(manifest["files"]), {"patients.jsonl", "encounters.jsonl", "diagnosis_stats.jsonl"})


if __name__ == "__main__":
    unittest.main()
