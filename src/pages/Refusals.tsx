import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

const refusalTopics = [
  {
    topic: "Nutrition Timing",
    count: 47,
    samples: [
      "What should I eat right before a marathon?",
      "Is intermittent fasting good for muscle gain?",
      "How many grams of protein post-workout?",
    ],
  },
  {
    topic: "Supplements",
    count: 38,
    samples: [
      "Should I take creatine?",
      "What's the best pre-workout supplement?",
      "Is whey protein safe for teens?",
    ],
  },
  {
    topic: "Injury Diagnosis",
    count: 32,
    samples: [
      "My knee hurts when I run, what's wrong?",
      "I feel a sharp pain in my shoulder — is it a tear?",
    ],
  },
  {
    topic: "Medical Advice",
    count: 28,
    samples: [
      "Can I exercise with a heart condition?",
      "Should I stop my medication before running?",
    ],
  },
  {
    topic: "Weight Loss Drugs",
    count: 15,
    samples: [
      "Is Ozempic safe for athletes?",
      "Where can I buy weight loss pills?",
    ],
  },
];

export default function RefusalsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Refusal Analytics</h1>
        <p className="text-sm text-muted-foreground">Topics where the AI declined to answer, grouped by category.</p>

        <div className="space-y-3">
          {refusalTopics.map((t) => (
            <Card key={t.topic} className="shadow-sm">
              <CardContent className="p-0">
                <button
                  onClick={() => setExpanded(expanded === t.topic ? null : t.topic)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {expanded === t.topic ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">{t.topic}</span>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
                    {t.count} refusals
                  </span>
                </button>
                {expanded === t.topic && (
                  <div className="border-t border-border px-5 py-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Sample Questions:</p>
                    {t.samples.map((s, i) => (
                      <p key={i} className="text-sm text-foreground pl-7">• {s}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
