import { useState } from "react";
import { getConfig, AppConfig } from "../utils/config";
import { ChevronUp, ChevronDown, Phone } from "lucide-react";
import type { FAQItem } from "../utils/config";

const C = {
    orange: "#F26B2B",
    text: "#FFFFFF",
    textMuted: "#A1A1A1",
    surface: "#1A1A1A",
    border: "#2A2A2A",
    borderStrong: "#3A3A3A",
    white: "#FFFFFF",
};

export default function FAQPage({
    config,
}: {
    config: AppConfig;
}) {
    const [open, setOpen] = useState<string | null>(null);

    const faqs: FAQItem[] = config.faqs;

    return (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px" }}>
            <p
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.orange,
                    marginBottom: 10,
                }}
            >
                FAQ
            </p>

            <h1
                style={{
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 800,
                    fontSize: 36,
                    color: C.text,
                    lineHeight: 1.1,
                    marginBottom: 40,
                }}
            >
                Common questions
            </h1>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {faqs.map((faq) => (
                    <div
                        key={faq.id}
                        style={{
                            background: open === faq.id ? C.surface : "transparent",
                            border: `1px solid ${open === faq.id ? C.borderStrong : C.border
                                }`,
                            borderRadius: 14,
                            overflow: "hidden",
                        }}
                    >
                        <button
                            onClick={() =>
                                setOpen(open === faq.id ? null : faq.id)
                            }
                            style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 16,
                                padding: "18px 20px",
                                textAlign: "left",
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                            }}
                        >
                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                                {faq.question}
                            </span>

                            <div
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 7,
                                    background: open === faq.id ? C.orange : "#222",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "background 0.3s ease",
                                }}
                            >
                                <ChevronDown
                                    size={13}
                                    color={open === faq.id ? "#fff" : C.textMuted}
                                    style={{
                                        transform: open === faq.id ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.3s ease, color 0.3s ease"
                                    }}
                                />
                            </div>
                        </button>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateRows: open === faq.id ? "1fr" : "0fr",
                                transition: "grid-template-rows 0.3s ease-in-out",
                            }}
                        >
                            <div style={{ overflow: "hidden" }}>
                                <div style={{ padding: "0 20px 18px" }}>
                                    <p
                                        style={{
                                            fontSize: 14,
                                            color: C.textMuted,
                                            lineHeight: 1.7,
                                            margin: 0,
                                        }}
                                    >
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    marginTop: 48,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    padding: "30px 28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                }}
            >
                <div>
                    <p style={{ fontWeight: 700, fontSize: 18, color: C.text }}>
                        Still have questions?
                    </p>

                    <p style={{ fontSize: 13, color: C.textMuted }}>
                        we answer the phone 24/7
                    </p>
                </div>

                <a
                    href={`tel:${config.company.phone}`}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 22px",
                        background: C.orange,
                        color: C.white,
                        fontSize: 14,
                        fontWeight: 700,
                        borderRadius: 12,
                        textDecoration: "none",
                    }}
                >
                    <Phone size={14} />
                    {config.company.phone}
                </a>
            </div>
        </div>
    );
}