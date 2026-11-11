## Introduction

A while ago I wrote a post about Jev and said I would try it for real. So here I am. Fair warning: I'm still learning, I only just started using it, and I don't have a pile of results to show you. This is more like "here's what I did and what I noticed so far" than a proper review.

## What I Did With It

Jev doesn't chat or write code. You give it a question and some options, and it gives you back one answer. So I wrote a small command-line tool around it (Node + the Vercel AI SDK) that my coding agents can call. It has five commands:

- **triage**: is this task small (one clear change) or a big epic?
- **score**: give a piece of work (code, plan, tests...) a score from 1 to 10 using a rubric.
- **check**: ask up to five yes/no questions about something.
- **drift**: is this still following the project rules?
- **decide**: pick one option from a list I give it.

Why? Because my agents love to just guess when they hit an open decision. I'd rather they ask something first.

## What "Effective" Means to Me

I'm not sure there's one right definition, but I went with three questions:

1. Does it pick a sensible option?
2. Does it know when it **doesn't** know?
3. Is it cheap enough to call a lot?

Honestly, I can only say something about 2 and 3 right now. For question 1 I just don't have enough data yet.

## The Good Stuff

**It tells you how sure it is.** Every answer comes with a probability. I set a confidence limit of 0.8 in my tool, and then it exits with a code:

- `0`: sure enough, keep going.
- `2`: not sure, ask again or ask a human.
- `4`: the score is too low, redo the work.
- `3`: I called it wrong (bad arguments, or the input is too long).

This is my favorite part. The agent just checks a number instead of reading a long explanation.

**It's very cheap.** One test call used 304 input tokens. With the price TypeSafe lists ($0.042 per million input tokens), that's about $0.00001. I haven't checked their price or speed claims myself, but my tool logs the tokens of every call, so I can keep an eye on it.

**Small safety rails help.** My tool refuses input longer than 12,000 characters (it says "summarize first"), remembers repeated calls so I don't pay twice, never remembers an "unsure" answer, and writes every call to a log file. That's not Jev, that's just me being careful so I don't waste tokens.

## The Not-So-Good Stuff

**I can't say if it's accurate yet.** The only call in my log is a test. Jev leaned towards option `a` (0.85 vs 0.15), but its confidence was 0.7, lower than my 0.8 limit, so my tool said "unsure". That's the tool doing its job, but it's also just one sample. One sample means nothing.

**It judges by MY rules.** The rubrics are written by me. If my question is vague, I'd get a confident answer to a vague question. So a lot depends on how well I describe the options.

**It can be tricked by what it reads.** TypeSafe says Jev doesn't treat input as hostile. If the text I give it contains instructions, they might push the answer. So for anything I can't undo, a human should still make the final call.

**Confident doesn't mean correct.** I still need real answers to compare against.

## What I Plan to Do Next

My log already saves the task, the kind of call, the exit code and the tokens. Next I want to save my own decision next to Jev's every time. Then I can count:

- how often I disagree with Jev,
- how often it's confident but wrong,
- how often it says "unsure" when I would also hesitate.

Until then, when I say "effective", I mean the design is good, not that the answers are proven.

## Conclusion

For now I think Jev is a nice gate: cheap, a clear answer, and it can say "I'm not sure". As the final judge, I wouldn't trust it yet. I'll use it for small, clear decisions and give anything unsure or hard to undo to a person.

I'll write another post when I have enough logged decisions to compare. If you've tried Jev too, I'd love to hear how it went for you.
