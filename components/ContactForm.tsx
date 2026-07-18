"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Notice from "./Notice";

type InquiryType = "family" | "self" | "professional" | "researcher" | "government" | "other";

const INQUIRY_OPTIONS: { value: InquiryType; label: string }[] = [
  { value: "family", label: "家族として状況を整理したい" },
  { value: "self", label: "本人として相談したい" },
  { value: "professional", label: "医療・介護・福祉の専門職として情報交換したい" },
  { value: "researcher", label: "研究者として調査・研究について相談したい" },
  { value: "government", label: "行政・地域団体として資料や講座について相談したい" },
  { value: "other", label: "その他" },
];

const FAMILY_GROUP: InquiryType[] = ["family", "self", "other"];

type Status = "idle" | "submitting" | "success" | "error";

function encodeFormData(formData: FormData): string {
  const params = new URLSearchParams();
  formData.forEach((value, key) => {
    if (typeof value === "string") params.append(key, value);
  });
  return params.toString();
}

type Props = {
  // 診断結果ページの相対パス（"/diagnosis/result?..."）。診断内容そのものは含まない。
  diagnosisResultPath?: string | null;
};

function subscribe() {
  return () => {};
}

export default function ContactForm({ diagnosisResultPath = null }: Props) {
  const [inquiryType, setInquiryType] = useState<InquiryType>("family");
  const [status, setStatus] = useState<Status>("idle");
  const [includeDiagnosisResult, setIncludeDiagnosisResult] = useState(Boolean(diagnosisResultPath));
  const formRef = useRef<HTMLFormElement>(null);
  const isFamilyGroup = FAMILY_GROUP.includes(inquiryType);

  // 絶対URLはブラウザ（window.location.origin、外部システム）の値に依存するため、
  // useSyncExternalStoreでサーバー描画時は相対パス、クライアントでは絶対URLを読み取る。
  const diagnosisResultUrl = useSyncExternalStore(
    subscribe,
    () => (diagnosisResultPath ? `${window.location.origin}${diagnosisResultPath}` : ""),
    () => diagnosisResultPath ?? "",
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;
    setStatus("submitting");

    try {
      const formData = new FormData(formRef.current);
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeFormData(formData),
      });

      if (response.ok) {
        setStatus("success");
        formRef.current.reset();
        setInquiryType("family");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-ohana-green bg-ohana-green-light p-8 text-center"
      >
        <p className="text-lg font-bold text-ohana-green-dark">
          お問い合わせを受け付けました。内容を確認のうえ、ご連絡します。
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      name="contact"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      action="/contact/thanks"
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
    >
      <input type="hidden" name="form-name" value="contact" />
      <input type="hidden" name="diagnosis-result-url" value={includeDiagnosisResult ? diagnosisResultUrl : ""} />
      <div style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          この項目は入力しないでください
          <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div hidden={!diagnosisResultPath}>
        <Notice title="整理結果を一緒に送信します">
          <p>
            3分整理ナビの整理結果ページのURLを、この相談内容と一緒に送信します。送信前に内容をご確認ください。個人情報や詳しい医療情報は含まれていません。
          </p>
          {diagnosisResultPath ? (
            <p className="mt-2 break-all">
              <a
                href={diagnosisResultPath}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {diagnosisResultUrl}
              </a>
            </p>
          ) : null}
          <label className="mt-3 flex items-start gap-3 text-sm leading-loose text-ohana-ink sm:text-base">
            <input
              type="checkbox"
              checked={includeDiagnosisResult}
              onChange={(event) => setIncludeDiagnosisResult(event.target.checked)}
              className="mt-1 h-5 w-5 flex-none accent-[#4d6656]"
            />
            <span>この結果URLを問い合わせ内容に含める（チェックを外すと送信しません）</span>
          </label>
        </Notice>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-bold text-ohana-ink">お問い合わせの種類</legend>
        <div className="flex flex-col gap-2">
          {INQUIRY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-base transition-colors ${
                inquiryType === option.value
                  ? "border-ohana-green bg-ohana-green-light"
                  : "border-ohana-beige-dark bg-ohana-white hover:border-ohana-green"
              }`}
            >
              <input
                type="radio"
                name="inquiry-type"
                value={option.value}
                checked={inquiryType === option.value}
                onChange={() => setInquiryType(option.value)}
                className="h-5 w-5 flex-none accent-[#4d6656]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 家族・本人向け項目（家族／本人／その他 を選んだ場合に表示） */}
      <div hidden={!isFamilyGroup} className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-ohana-ink">ご入力いただく内容</h2>

        <Field label="お名前" htmlFor="family-name" required>
          <input
            id="family-name"
            name="family-name"
            type="text"
            required={isFamilyGroup}
            autoComplete="name"
            className={inputClass}
          />
        </Field>

        <Field label="メールアドレス" htmlFor="family-email" required>
          <input
            id="family-email"
            name="family-email"
            type="email"
            required={isFamilyGroup}
            autoComplete="email"
            className={inputClass}
          />
        </Field>

        <Field label="電話番号（任意）" htmlFor="family-phone">
          <input
            id="family-phone"
            name="family-phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
          />
        </Field>

        <Field label="ご本人との関係" htmlFor="family-relationship">
          <select id="family-relationship" name="family-relationship" className={inputClass} defaultValue="">
            <option value="" disabled>
              選択してください
            </option>
            <option value="本人">本人</option>
            <option value="配偶者">配偶者</option>
            <option value="子">子</option>
            <option value="兄弟姉妹">兄弟姉妹</option>
            <option value="その他の親族">その他の親族</option>
            <option value="その他">その他</option>
          </select>
        </Field>

        <Field label="居住地域（市区町村まで）" htmlFor="family-region">
          <input
            id="family-region"
            name="family-region"
            type="text"
            placeholder="例）神奈川県平塚市"
            className={inputClass}
          />
        </Field>

        <Field
          label="現在の状況"
          htmlFor="family-situation"
          hint="病名や資産額など、詳細な個人情報の記載は不要です。"
        >
          <textarea id="family-situation" name="family-situation" rows={4} className={inputClass} />
        </Field>

        <Field label="困っていること" htmlFor="family-concerns">
          <textarea id="family-concerns" name="family-concerns" rows={4} className={inputClass} />
        </Field>

        <Field label="希望する連絡方法" htmlFor="family-contact-method">
          <select
            id="family-contact-method"
            name="family-contact-method"
            className={inputClass}
            defaultValue=""
          >
            <option value="" disabled>
              選択してください
            </option>
            <option value="メール">メール</option>
            <option value="電話">電話</option>
            <option value="どちらでも">どちらでも</option>
          </select>
        </Field>

        <ConsentField id="family-consent" name="family-consent" required={isFamilyGroup} />
      </div>

      {/* 専門職・研究者・行政向け項目 */}
      <div hidden={isFamilyGroup} className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-ohana-ink">ご入力いただく内容</h2>

        <Notice title="ご入力にあたってのお願い">
          患者様やご利用者様など、本人が特定できる情報は、ご本人の同意なくご入力いただかないようお願いいたします。
        </Notice>

        <Field label="お名前" htmlFor="professional-name" required>
          <input
            id="professional-name"
            name="professional-name"
            type="text"
            required={!isFamilyGroup}
            autoComplete="name"
            className={inputClass}
          />
        </Field>

        <Field label="所属機関" htmlFor="professional-affiliation">
          <input id="professional-affiliation" name="professional-affiliation" type="text" className={inputClass} />
        </Field>

        <Field label="職種または役割" htmlFor="professional-role">
          <input id="professional-role" name="professional-role" type="text" className={inputClass} />
        </Field>

        <Field label="メールアドレス" htmlFor="professional-email" required>
          <input
            id="professional-email"
            name="professional-email"
            type="email"
            required={!isFamilyGroup}
            autoComplete="email"
            className={inputClass}
          />
        </Field>

        <Field label="電話番号（任意）" htmlFor="professional-phone">
          <input id="professional-phone" name="professional-phone" type="tel" className={inputClass} />
        </Field>

        <Field label="相談・情報交換の内容" htmlFor="professional-content">
          <textarea id="professional-content" name="professional-content" rows={5} className={inputClass} />
        </Field>

        <ConsentField id="professional-consent" name="professional-consent" required={!isFamilyGroup} />
      </div>

      {status === "error" ? (
        <div role="alert">
          <Notice title="送信できませんでした" tone="caution">
            送信に失敗しました。恐れ入りますが、通信状況をご確認のうえ、時間をおいて再度お試しください。
          </Notice>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ohana-green px-6 py-3 text-base font-semibold text-ohana-white hover:bg-ohana-green-dark disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "送信しています…" : "この内容で送信する"}
      </button>
    </form>
  );
}

const inputClass =
  "min-h-12 w-full rounded-lg border-2 border-ohana-beige-dark bg-ohana-white px-4 py-2 text-base text-ohana-ink focus:border-ohana-green";

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-base font-semibold text-ohana-ink">
        {label}
        {required ? <span className="ml-1 text-ohana-brown">必須</span> : null}
      </label>
      {hint ? <p className="text-sm text-ohana-gray">{hint}</p> : null}
      {children}
    </div>
  );
}

function ConsentField({ id, name, required }: { id: string; name: string; required: boolean }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm leading-loose text-ohana-ink sm:text-base">
      <input id={id} name={name} type="checkbox" value="同意する" required={required} className="mt-1 h-5 w-5 flex-none accent-[#4d6656]" />
      <span>
        <a href="/privacy" className="underline underline-offset-2">
          プライバシーポリシー
        </a>
        の内容を確認し、個人情報の取り扱いに同意します。
      </span>
    </label>
  );
}
