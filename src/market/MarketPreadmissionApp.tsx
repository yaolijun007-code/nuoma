import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  UserRound,
} from "lucide-react";
import {
  contactResultLabel,
  intendedDepartmentOptions,
  notificationStatusLabel,
  patientTypeOptions,
  type ContactResult,
  type IntendedDepartment,
  type MarketUser,
  type NewPatientDraft,
  type PatientType,
  type PatientHistory,
  type PatientSummary,
  type PreadmissionRecord,
  type PreadmissionListItem,
} from "../domain/market-preadmission";
import {
  createDefaultMarketApi,
  isStrongMarketPassword,
  marketPasswordRuleMessage,
  MarketApiError,
  type MarketApi,
} from "./api";
import "./market-preadmission.css";

type View = "workspace" | "records" | "password";

interface MarketPreadmissionAppProps {
  api?: MarketApi;
}

interface FormState {
  contactPhone: string;
  patientType: PatientType | "";
  plannedAdmissionDate: string;
  intendedDepartment: IntendedDepartment | "";
  mainProblem: string;
  contactResult: ContactResult | "";
  notes: string;
}

const emptyForm: FormState = {
  contactPhone: "",
  patientType: "",
  plannedAdmissionDate: "",
  intendedDepartment: "",
  mainProblem: "",
  contactResult: "",
  notes: "",
};

function makeSubmissionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return "00000000-0000-4000-8000-000000000000".replace(/[018]/g, (character) =>
    (Number(character) ^ Math.floor(Math.random() * 16) >> Number(character) / 4).toString(16));
}

function dateLabel(value?: string, empty = "日期未记录") {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return empty;
  return value;
}

function dateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待核实";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function statusClass(status: PreadmissionRecord["notificationStatus"]) {
  return `status-badge status-${status.replace("_", "-")}`;
}

function toPreadmissionListItem(record: PreadmissionRecord): PreadmissionListItem {
  return {
    recordId: record.recordId,
    patientName: record.patientName,
    plannedAdmissionDate: record.plannedAdmissionDate,
    contactResult: record.contactResult,
    createdAt: record.createdAt,
    notificationStatus: record.notificationStatus,
  };
}

function InitialMark() {
  return <span className="market-brand-mark" aria-hidden="true"><span /><span /></span>;
}

function LoginScreen({ onLogin, busy, error }: { onLogin: (username: string, password: string) => void; busy: boolean; error: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onLogin(username, password);
  };
  return (
    <main className="market-login-shell">
      <section className="market-login-card" aria-labelledby="login-title">
        <div className="market-login-brand"><InitialMark /><div><strong>建始民族医院</strong><span>内部工作台</span></div></div>
        <p className="market-kicker">市场协同</p>
        <h1 id="login-title">患者预住院登记</h1>
        <p className="market-login-copy">查询有限住院历史，登记预住院计划并同步工作群。</p>
        <form onSubmit={handleSubmit} className="market-login-form">
          <label htmlFor="market-username">账号</label>
          <input
            id="market-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            inputMode="text"
            required
          />
          <label htmlFor="market-password">密码</label>
          <input
            id="market-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {error ? <div className="market-alert error" role="alert">{error}</div> : null}
          <button type="submit" className="market-primary-button" disabled={busy}>
            {busy ? "正在登录…" : "登录"}
          </button>
        </form>
        <p className="market-privacy-note">仅限授权人员使用。请勿在公共设备保存账号信息。</p>
      </section>
    </main>
  );
}

function StepRail({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["查患者", "看历史", "登记推送"];
  return (
    <ol className="market-step-rail" aria-label="办理步骤">
      {labels.map((label, index) => {
        const number = index + 1;
        return (
          <li key={label} className={number === step ? "is-current" : number < step ? "is-complete" : ""} aria-current={number === step ? "step" : undefined}>
            <span>{number < step ? <CheckCircle2 size={17} /> : number}</span>{label}
          </li>
        );
      })}
    </ol>
  );
}

type PasswordErrorField = "old" | "new" | "confirm" | "form" | null;

function ChangePasswordView({ onChangePassword, onBack }: {
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  onBack: () => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<PasswordErrorField>(null);
  const [success, setSuccess] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setErrorField(null);
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致，请重新确认");
      setErrorField("confirm");
      return;
    }
    if (newPassword === oldPassword) {
      setError("新密码不能与旧密码相同");
      setErrorField("new");
      return;
    }
    if (!isStrongMarketPassword(newPassword)) {
      setError(marketPasswordRuleMessage);
      setErrorField("new");
      return;
    }
    setBusy(true);
    try {
      await onChangePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("密码修改成功，旧密码已失效");
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "密码修改失败，请稍后重试";
      setError(message);
      setErrorField(reason instanceof MarketApiError && reason.code === "INVALID_OLD_PASSWORD" ? "old" : "form");
    } finally {
      setBusy(false);
    }
  };

  const describedBy = (field: Exclude<PasswordErrorField, "form" | null>, includeRule = false) => {
    const ids = [];
    if (includeRule) ids.push("market-password-rule");
    if (error && errorField === field) ids.push("market-password-error");
    return ids.length ? ids.join(" ") : undefined;
  };

  return (
    <section className="market-section password-section" aria-labelledby="change-password-title">
      <button type="button" className="market-text-button" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />返回患者登记</button>
      <div className="section-heading password-heading">
        <div><p className="market-kicker">账号安全</p><h1 id="change-password-title">修改密码</h1></div>
        <p>只能修改当前登录账号</p>
      </div>
      <p className="password-intro">请输入现用密码并设置新密码。修改成功后，旧密码立即失效。</p>
      <form className="password-form" onSubmit={submit} aria-busy={busy}>
        <div className="form-field">
          <label htmlFor="current-account-password">旧密码</label>
          <input
            id="current-account-password"
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={64}
            aria-invalid={errorField === "old"}
            aria-describedby={describedBy("old")}
            disabled={busy}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="new-account-password">新密码</label>
          <input
            id="new-account-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            minLength={8}
            maxLength={64}
            aria-invalid={errorField === "new"}
            aria-describedby={describedBy("new", true)}
            disabled={busy}
            required
          />
          <small id="market-password-rule" className="password-rule">8–64 位，包含大小写字母、数字和特殊字符。</small>
        </div>
        <div className="form-field">
          <label htmlFor="confirm-account-password">确认新密码</label>
          <input
            id="confirm-account-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            minLength={8}
            maxLength={64}
            aria-invalid={errorField === "confirm"}
            aria-describedby={describedBy("confirm")}
            disabled={busy}
            required
          />
        </div>
        {error ? <div id="market-password-error" className="market-alert error password-message" role="alert">{error}</div> : null}
        {success ? <div className="market-alert password-success password-message" role="status"><CheckCircle2 size={18} aria-hidden="true" />{success}</div> : null}
        <div className="password-actions">
          <button type="submit" className="market-primary-button" disabled={busy}>{busy ? "正在修改…" : "确认修改密码"}</button>
        </div>
      </form>
    </section>
  );
}

function PatientCandidate({ patient, onSelect }: { patient: PatientSummary; onSelect: () => void }) {
  return (
    <button type="button" className="patient-candidate" onClick={onSelect} aria-label={`选择患者 ${patient.name}，住院号 ${patient.hospitalNo || "未记录"}`}>
      <span className="candidate-main">
        <span className="candidate-name"><UserRound size={18} />{patient.name}</span>
        <span>{patient.sex || "性别未记录"} · {patient.age ?? "年龄未记录"}</span>
      </span>
      <span className="candidate-facts">
        <span>联系电话 {patient.phone || "未记录"}</span>
        <span>住院号 {patient.hospitalNo || "未记录"}</span>
        <span>既往住院 {patient.admissionCount} 次</span>
      </span>
      {patient.identityRisk ? (
        <span className="identity-warning"><AlertTriangle size={16} />{patient.identityRiskReasons?.[0] || "身份信息需人工核对"}</span>
      ) : null}
      <ChevronRight className="candidate-arrow" size={20} aria-hidden="true" />
    </button>
  );
}

function NewPatientForm({ onCancel, onContinue }: {
  onCancel: () => void;
  onContinue: (profile: NewPatientDraft, phone: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onContinue({ name: name.trim(), sex, age: age ? Number(age) : null }, phone.trim());
  };
  return (
    <form className="new-patient-form" onSubmit={submit} aria-label="新患者首次登记">
      <div className="section-heading">
        <div><p className="market-kicker">新患者</p><h2>建立首次登记资料</h2></div>
        <p>不要求已有住院记录</p>
      </div>
      <div className="new-patient-grid">
        <div className="form-field"><label htmlFor="new-patient-name">新患者姓名</label><input id="new-patient-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} autoComplete="name" required /></div>
        <div className="form-field"><label htmlFor="new-patient-phone">新患者联系电话</label><input id="new-patient-phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" pattern="[0-9+() -]{5,30}" required /></div>
        <div className="form-field"><label htmlFor="new-patient-sex">新患者性别</label><select id="new-patient-sex" value={sex} onChange={(event) => setSex(event.target.value)}><option value="">未记录</option><option value="男">男</option><option value="女">女</option><option value="其他">其他</option><option value="不详">不详</option></select></div>
        <div className="form-field"><label htmlFor="new-patient-age">新患者年龄</label><input id="new-patient-age" type="number" min="0" max="120" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} placeholder="选填" /></div>
      </div>
      <div className="new-patient-actions"><button type="button" className="market-text-button" onClick={onCancel}>取消</button><button type="submit" className="market-primary-button">继续填写预住院信息</button></div>
    </form>
  );
}

function PatientHistoryPanel({ history, onBack }: { history: PatientHistory; onBack: () => void }) {
  const patient = history.patient;
  return (
    <section className="market-section history-section" aria-labelledby="patient-history-title">
      <button type="button" className="market-text-button" onClick={onBack}><ArrowLeft size={17} />返回查询结果</button>
      <div className="patient-identity-card">
        <div>
          <p className="market-kicker">已选择患者</p>
          <h2 id="patient-history-title">{patient.name}</h2>
          <p>{patient.sex || "性别未记录"} · {patient.age ?? "年龄未记录"} 岁 · 联系电话 {patient.phone || "未记录"}</p>
        </div>
        <div className="patient-count"><strong>{patient.admissionCount}</strong><span>住院次数</span></div>
      </div>
      {!patient.patientId ? <div className="market-alert info"><UserPlus size={18} />暂无既往住院记录，新患者档案将在提交时建立</div> : null}
      {patient.identityRisk ? (
        <div className="market-alert warning"><AlertTriangle size={18} />{patient.identityRiskReasons?.join("；") || "该患者身份信息需人工核对"}</div>
      ) : null}
      <div className="history-grid">
        <div className="history-block">
          <h3>主要诊断</h3>
          {history.diagnoses.length ? (
            <ul className="diagnosis-list">
              {history.diagnoses.map((item) => <li key={`${item.diagnosis}-${item.lastAdmissionDate}`}><span>{item.diagnosis || "诊断未记录"}</span><small>{item.count} 次</small></li>)}
            </ul>
          ) : <p className="empty-copy">暂无诊断统计</p>}
        </div>
        <div className="history-block history-wide">
          <h3>住院记录</h3>
          <p className="history-summary">共住院 {patient.admissionCount} 次</p>
          {history.encounters.length ? (
            <div className="encounter-list">
              {history.encounters.map((encounter) => (
                <article className="encounter-card" key={encounter.encounterId}>
                  <div className="encounter-index">第 {encounter.sequence || "—"} 次</div>
                  <div><strong>{encounter.mainDiagnosis || "主要诊断未记录"}</strong><span><Building2 size={15} />{encounter.department || "科室未记录"}</span></div>
                  <div className="encounter-dates">
                    <span><CalendarDays size={15} />入院 {dateLabel(encounter.admissionDate, "入院日期未记录")}</span>
                    <span><CalendarDays size={15} />{encounter.dischargeDate ? `出院 ${dateLabel(encounter.dischargeDate)}` : "出院日期未记录"}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="empty-copy">暂无可用住院记录</p>}
        </div>
      </div>
    </section>
  );
}

function PreadmissionForm({
  history,
  form,
  onChange,
  onSubmit,
  busy,
  result,
  onRetry,
  onNewPatient,
}: {
  history: PatientHistory;
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
  result: PreadmissionRecord | null;
  onRetry: () => void;
  onNewPatient: () => void;
}) {
  const locked = Boolean(result);
  return (
    <section className="market-section preadmission-section" aria-labelledby="preadmission-title">
      <div className="section-heading">
        <div><p className="market-kicker">第 3 步</p><h2 id="preadmission-title">预住院登记</h2></div>
        <p>患者：<strong>{history.patient.name}</strong></p>
      </div>
      <form className="preadmission-form" onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="contact-phone">本次联系电话</label>
          <input id="contact-phone" value={form.contactPhone} onChange={(event) => onChange("contactPhone", event.target.value)} inputMode="tel" autoComplete="tel" disabled={busy || locked} required />
          <small>群消息将按工作要求显示完整号码，请提交前再次核对。</small>
        </div>
        <div className="form-field">
          <label htmlFor="patient-type">患者类型</label>
          <select id="patient-type" value={form.patientType} onChange={(event) => onChange("patientType", event.target.value)} disabled={busy || locked} required>
            <option value="">请选择患者类型</option>
            {patientTypeOptions.map((option) => <option value={option} key={option}>{option}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="planned-date">计划住院日期</label>
          <input id="planned-date" type="date" value={form.plannedAdmissionDate} onChange={(event) => onChange("plannedAdmissionDate", event.target.value)} disabled={busy || locked} required />
        </div>
        <div className="form-field">
          <label htmlFor="intended-department">拟住院科室</label>
          <select id="intended-department" value={form.intendedDepartment} onChange={(event) => onChange("intendedDepartment", event.target.value)} disabled={busy || locked} required>
            <option value="">请选择拟住院科室</option>
            {intendedDepartmentOptions.map((option) => <option value={option} key={option}>{option}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="contact-result">联系结果</label>
          <select id="contact-result" value={form.contactResult} onChange={(event) => onChange("contactResult", event.target.value)} disabled={busy || locked} required>
            <option value="">请选择</option>
            <option value="patient_interested">患者本人有意愿</option>
            <option value="family_interested">家属有意愿</option>
            <option value="considering">正在考虑</option>
            <option value="no_answer">暂未接通</option>
            <option value="declined">暂不考虑</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div className="form-field form-wide">
          <label htmlFor="main-problem">主要问题</label>
          <textarea id="main-problem" value={form.mainProblem} onChange={(event) => onChange("mainProblem", event.target.value)} maxLength={500} rows={4} placeholder="简要记录患者当前最主要的问题和住院诉求" disabled={busy || locked} required />
        </div>
        <div className="form-field form-wide">
          <label htmlFor="notes">备注（选填）</label>
          <textarea id="notes" value={form.notes} onChange={(event) => onChange("notes", event.target.value)} maxLength={500} rows={2} placeholder="例如：适合联系的时间" disabled={busy || locked} />
        </div>
        <div className="form-actions form-wide">
          <p><Send size={17} />保存成功后自动推送到授权的企业微信群</p>
          <button type="submit" className="market-primary-button" disabled={busy || locked}>
            {busy ? "正在保存并推送…" : locked ? "登记已保存" : "保存并推送到企业微信群"}
          </button>
        </div>
      </form>
      {result ? (
        <div className={`submission-result result-${result.notificationStatus}`} aria-live="polite">
          <div>
            {result.notificationStatus === "sent" ? <CheckCircle2 size={21} /> : <AlertTriangle size={21} />}
            <div><strong>{notificationStatusLabel(result.notificationStatus)}</strong><span>登记编号：{result.recordId}</span></div>
          </div>
          <div className="submission-result-actions">
            {["failed", "not_configured"].includes(result.notificationStatus) ? (
              <button type="button" className="market-secondary-button" onClick={onRetry} disabled={busy}><RefreshCw size={17} />重新推送</button>
            ) : null}
            <button type="button" className="market-secondary-button" onClick={onNewPatient} disabled={busy}>开始下一位患者</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RecordsView({ records, loading, error, onReload, onRetry }: {
  records: PreadmissionListItem[];
  loading: boolean;
  error: string;
  onReload: () => void;
  onRetry: (record: PreadmissionListItem) => void;
}) {
  return (
    <section className="market-section records-section" aria-labelledby="records-title">
      <div className="section-heading"><div><p className="market-kicker">工作记录</p><h2 id="records-title">我的登记</h2></div><span>{records.length} 条</span></div>
      {loading ? <p className="empty-copy">正在加载…</p> : error ? (
        <div className="market-alert error records-error" role="alert"><AlertTriangle size={18} /><span>{error}</span><button type="button" className="market-secondary-button" onClick={onReload}>重新加载登记记录</button></div>
      ) : records.length ? (
        <div className="records-list">
          {records.map((record) => (
            <article key={record.recordId} className="record-row">
              <div><strong>{record.patientName}</strong><span>{record.recordId}</span></div>
              <div><small>计划住院</small><span>{record.plannedAdmissionDate}</span></div>
              <div><small>联系结果</small><span>{contactResultLabel(record.contactResult)}</span></div>
              <div><small>登记时间</small><span>{dateTimeLabel(record.createdAt)}</span></div>
              <span className={statusClass(record.notificationStatus)}>{notificationStatusLabel(record.notificationStatus)}</span>
              {["failed", "not_configured"].includes(record.notificationStatus) ? (
                <button type="button" className="market-icon-button" aria-label={`重新推送 ${record.patientName}`} onClick={() => onRetry(record)}><RefreshCw size={18} /></button>
              ) : <span className="record-spacer" />}
            </article>
          ))}
        </div>
      ) : <div className="market-empty"><History size={28} /><strong>还没有登记记录</strong><p>完成第一位患者的预住院登记后会显示在这里。</p></div>}
    </section>
  );
}

export function MarketPreadmissionApp({ api: providedApi }: MarketPreadmissionAppProps) {
  const apiResolution = useMemo(() => {
    try { return { api: providedApi ?? createDefaultMarketApi(), error: "" }; }
    catch { return { api: null, error: "系统尚未完成 CloudBase 登录配置，请联系管理员" }; }
  }, [providedApi]);
  const api = apiResolution.api;
  const [session, setSession] = useState<MarketUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState(apiResolution.error);
  const [view, setView] = useState<View>("workspace");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [candidates, setCandidates] = useState<PatientSummary[]>([]);
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [newPatientMode, setNewPatientMode] = useState(false);
  const [newPatient, setNewPatient] = useState<NewPatientDraft | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submissionId, setSubmissionId] = useState(makeSubmissionId);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [result, setResult] = useState<PreadmissionRecord | null>(null);
  const [records, setRecords] = useState<PreadmissionListItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadRecords = async () => {
    if (!api) return;
    setRecordsLoading(true);
    setRecordsError("");
    try { setRecords(await api.listPreadmissions(30)); }
    catch { setRecordsError("登记记录加载失败，请检查网络后重试"); }
    finally { setRecordsLoading(false); }
  };

  useEffect(() => {
    let active = true;
    if (!api) { setBooting(false); return () => { active = false; }; }
    api.restoreSession()
      .then((user) => { if (active) setSession(user); })
      .catch(() => { if (active) setSession(null); })
      .finally(() => { if (active) setBooting(false); });
    return () => { active = false; };
  }, [api]);

  useEffect(() => {
    if (session) void loadRecords();
  }, [session]);

  const handleLogin = async (username: string, password: string) => {
    if (!api) return;
    setLoginBusy(true);
    setLoginError("");
    try { setSession(await api.login(username, password)); }
    catch { setLoginError("账号或密码不正确，请重新输入"); }
    finally { setLoginBusy(false); }
  };

  const clearPatient = () => {
    setHistory(null);
    setNewPatient(null);
    setNewPatientMode(false);
    setForm(emptyForm);
    setResult(null);
    setSubmissionError("");
    setSubmissionId(makeSubmissionId());
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!api) return;
    setSearching(true);
    setSearchError("");
    setHistory(null);
    setNewPatient(null);
    setNewPatientMode(false);
    setResult(null);
    try {
      const found = await api.searchPatients(query);
      setCandidates(found);
      if (!found.length) setSearchError("未找到匹配患者，请核对姓名、手机号或住院号");
    } catch (error) {
      setCandidates([]);
      setSearchError(error instanceof Error ? error.message : "查询失败，请稍后重试");
    } finally { setSearching(false); }
  };

  const selectPatient = async (patient: PatientSummary) => {
    if (!api) return;
    setSearching(true);
    setSearchError("");
    try {
      const selected = await api.getPatientHistory(patient.patientId);
      setHistory(selected);
      setNewPatient(null);
      setNewPatientMode(false);
      setForm({ ...emptyForm, contactPhone: selected.patient.phone });
      setResult(null);
      setSubmissionId(makeSubmissionId());
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "患者历史加载失败");
    } finally { setSearching(false); }
  };

  const continueNewPatient = (profile: NewPatientDraft, phone: string) => {
    setNewPatient(profile);
    setNewPatientMode(false);
    setCandidates([]);
    setSearchError("");
    setHistory({
      patient: {
        patientId: "",
        patientCode: "",
        name: profile.name,
        sex: profile.sex,
        age: profile.age,
        phone,
        hospitalNo: "",
        admissionCount: 0,
        identityRisk: false,
      },
      encounters: [],
      diagnoses: [],
    });
    setForm({ ...emptyForm, contactPhone: phone });
    setResult(null);
    setSubmissionId(makeSubmissionId());
  };

  const updateForm = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!api || !history || !form.patientType || !form.intendedDepartment || !form.contactResult) return;
    setSubmitting(true);
    setSubmissionError("");
    try {
      const saved = await api.createPreadmission({
        clientSubmissionId: submissionId,
        patientId: history.patient.patientId,
        contactPhone: form.contactPhone,
        patientType: form.patientType,
        plannedAdmissionDate: form.plannedAdmissionDate,
        intendedDepartment: form.intendedDepartment,
        mainProblem: form.mainProblem,
        contactResult: form.contactResult,
        notes: form.notes,
        ...(newPatient ? { newPatient } : {}),
      });
      setResult(saved);
      setRecords((current) => [toPreadmissionListItem(saved), ...current.filter((item) => item.recordId !== saved.recordId)]);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "登记保存失败，请稍后重试");
    } finally { setSubmitting(false); }
  };

  const retry = async (record: Pick<PreadmissionRecord, "recordId">) => {
    if (!api) return;
    setSubmitting(true);
    setSubmissionError("");
    try {
      const updated = await api.retryNotification(record.recordId);
      setRecords((current) => current.map((item) => item.recordId === updated.recordId ? toPreadmissionListItem(updated) : item));
      if (result?.recordId === updated.recordId) setResult(updated);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "重新推送失败，请稍后再试");
    } finally { setSubmitting(false); }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!api) throw new MarketApiError("CONFIG_REQUIRED", "系统尚未完成 CloudBase 登录配置，请联系管理员");
    await api.changePassword(oldPassword, newPassword);
  };

  const logout = async () => {
    try {
      if (api) await api.logout();
    } catch {
      // Local PHI must be cleared even when the remote sign-out request fails.
    } finally {
      setSession(null);
      setCandidates([]);
      setHistory(null);
      setNewPatient(null);
      setNewPatientMode(false);
      setRecords([]);
      setRecordsError("");
      setForm(emptyForm);
      setQuery("");
      setResult(null);
      setView("workspace");
    }
  };

  if (booting) return <main className="market-loading" aria-live="polite"><InitialMark /><p>正在验证登录状态…</p></main>;
  if (!session) return <LoginScreen onLogin={handleLogin} busy={loginBusy} error={loginError} />;

  const currentStep: 1 | 2 | 3 = history ? 3 : candidates.length ? 2 : 1;
  return (
    <div className="market-app-shell">
      <header className="market-topbar">
        <div className="market-topbar-inner">
          <div className="market-product"><InitialMark /><div><strong>患者预住院登记</strong><span>建始民族医院</span></div></div>
          <nav aria-label="主导航">
            <button type="button" className={view === "workspace" ? "is-active" : ""} onClick={() => setView("workspace")}>患者登记</button>
            <button type="button" className={view === "records" ? "is-active" : ""} onClick={() => { setView("records"); void loadRecords(); }}>我的登记</button>
          </nav>
          <div className="market-user">
            <span><strong>{session.displayName}</strong><small>{session.username}</small></span>
            <button type="button" className="market-account-action" aria-label="修改密码" aria-pressed={view === "password"} onClick={() => setView("password")}><KeyRound size={18} aria-hidden="true" /><span>修改密码</span></button>
            <button type="button" aria-label="退出登录" onClick={logout}><LogOut size={19} aria-hidden="true" /></button>
          </div>
        </div>
      </header>
      <main className="market-main">
        {view === "workspace" ? (
          <>
            <StepRail step={currentStep} />
            <section className="market-section search-section" aria-labelledby="patient-search-title">
              <div className="section-heading">
                <div><p className="market-kicker">第 1 步</p><h1 id="patient-search-title">查询患者</h1></div>
                <p>姓名、手机号或住院号，任选一项</p>
              </div>
              <form className="patient-search" onSubmit={handleSearch}>
                <label htmlFor="patient-query">患者姓名、手机号或住院号</label>
                <div className="search-row">
                  <span className="search-input-wrap"><Search size={20} /><input ref={searchInputRef} id="patient-query" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="患者姓名 / 11 位手机号 / 住院号" required /></span>
                  <button type="submit" className="market-primary-button" disabled={searching}>{searching ? "查询中…" : "查询"}</button>
                </div>
              </form>
              {!newPatientMode ? (
                <aside className="new-patient-entry is-prominent" role="note" aria-label="新患者首次登记提示">
                  <span className="new-patient-entry-icon" aria-hidden="true"><UserPlus size={22} /></span>
                  <span className="new-patient-entry-copy"><strong>首次来院或查不到档案？</strong><small>无需既往住院记录，可直接建立新患者资料。</small></span>
                  <button type="button" className="market-secondary-button" onClick={() => { setNewPatientMode(true); setCandidates([]); setSearchError(""); }}><UserPlus size={17} aria-hidden="true" />新患者首次登记</button>
                </aside>
              ) : <NewPatientForm onCancel={() => setNewPatientMode(false)} onContinue={continueNewPatient} />}
              {searchError ? <div className="market-alert error" role="alert">{searchError}</div> : null}
              {candidates.length && !history ? (
                <div className="candidate-results" aria-live="polite"><div className="results-heading"><strong>找到 {candidates.length} 位患者</strong><span>请选择并核对正确患者</span></div>{candidates.map((patient) => <PatientCandidate key={patient.patientId} patient={patient} onSelect={() => void selectPatient(patient)} />)}</div>
              ) : null}
            </section>
            {history ? <PatientHistoryPanel history={history} onBack={clearPatient} /> : null}
            {history ? (
              <PreadmissionForm history={history} form={form} onChange={updateForm} onSubmit={handleSubmit} busy={submitting} result={result} onRetry={() => result && void retry(result)} onNewPatient={clearPatient} />
            ) : null}
            {submissionError ? <div className="market-alert error floating-error" role="alert">{submissionError}</div> : null}
          </>
        ) : view === "records" ? (
          <RecordsView records={records} loading={recordsLoading} error={recordsError} onReload={() => void loadRecords()} onRetry={(record) => void retry(record)} />
        ) : (
          <ChangePasswordView onChangePassword={changePassword} onBack={() => setView("workspace")} />
        )}
      </main>
      <footer className="market-footer"><Clock3 size={15} />内部工作系统 · 仅处理本次工作所需信息</footer>
    </div>
  );
}

export default MarketPreadmissionApp;
