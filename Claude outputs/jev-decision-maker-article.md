## Introduction

In my earlier post about Jev I said I would try it and write about the real experience. This is that follow-up, with one warning up front: **I am a software engineer who is still learning, and what I have is early impressions, not a benchmark.** I will separate what I can show from what I only expect.

## What I Actually Built

Jev only answers structured questions, so I wrapped it in a small command-line tool (Node, using the Vercel AI SDK) that my coding agents can call. It has five commands:

- **triage**: is this request SMALL (one bounded change) or an EPIC?
- **score**: rate an artifact (code, plan, tests, security review, brief, handoff, charter) against a rubric, on a 1 to 10 scale.
- **check**: up to five yes/no questions about an artifact.
- **drift**: does this output still follow the project's charter?
- **decide**: pick one option from a list I define.

The point is to stop an agent from quietly guessing when it hits an open decision. It asks Jev instead.

## What "Effective" Means Here

A decision maker that is right 100% of the time does not exist, so I judge Jev on three questions:

1. Does it pick a sensible option?
2. Does it **know when it does not know**?
3. Is it cheap enough to call often?

Only the second and third can be judged from what I have so far. The first needs more data than I have.

## What Works

**Uncertainty is part of the answer.** Jev returns a probability with each decision, so my wrapper can act on it. I set a confidence threshold of 0.8, and the tool returns one of a few exit codes:

- `0`: confident, carry on.
- `2`: uncertain, ask again or ask a human.
- `4`: the score is below the minimum, revise the work.
- `3`: bad arguments or input too long, fix the call instead of retrying.

An agent can branch on a number instead of parsing a paragraph of reasoning. This is the biggest practical win for me.

**The cost is small enough to stop worrying about.** One of my test calls used 304 input tokens. At the vendor's published price of $0.042 per million input tokens, that is about $0.00001. I have not verified TypeSafe's price or speed claims myself, but the log shows the token count for every call, so I can watch it.

**Guardrails are cheap to add around it.** The wrapper refuses inputs above 12,000 characters ("summarize first"), caches repeated identical calls, never caches an uncertain result, and writes every call to a log. None of this is Jev itself. It is ordinary engineering around a narrow tool, and it keeps token waste under control.

## What Does Not Work (Yet)

**I do not have enough calls to claim accuracy.** My only logged call is a test. Jev leaned toward option `a` (0.85 vs 0.15), but its reported confidence was 0.7, under my 0.8 threshold, so the wrapper returned "uncertain". That is the system working as designed, and it is also a reminder that a single sample proves nothing.

**Jev scores against my criteria.** The rubrics ("Are tasks small, with clear boundaries?") are my wording. A vague rubric gives a confident answer to a vague question. The quality of the decision depends on how well I define the options.

**It can be steered by what it reads.** TypeSafe's own limitations say Jev does not treat input as hostile. If an artifact contains instructions, the decision can be pushed. For anything irreversible, a human still has to be the last gate.

**A confident answer is not a correct answer.** Calibration helps, but I still need ground truth to check it.

## How I Plan to Measure It

The log already stores the task, the kind of call, the exit code and the input tokens. The next step is to record my own decision next to Jev's for each case. Then I can count three things:

- How often I override Jev.
- How often it is confident and wrong.
- How often it says "uncertain" when a human would also hesitate.

Until I have those numbers, "effective" is a claim about the design, not about accuracy.

## Conclusion

Used as a gate, Jev already looks useful: it is cheap, it returns a typed answer, and it can say "I am not sure". Used as an oracle, it is unproven. My conclusion for now is to let it handle small, well-defined decisions, and to send anything uncertain or irreversible to a person.

I will write a third post once I have enough logged decisions to compare against my own.
