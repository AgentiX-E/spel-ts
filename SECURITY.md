# Security policy

## Reporting a vulnerability

Report security issues through GitHub's private vulnerability reporting:

**https://github.com/AgentiX-E/spel-ts/security/advisories/new**

That opens a draft advisory visible only to the maintainers, so a report can be discussed and
fixed before it becomes public. Please do not open a public issue for a suspected vulnerability.

Useful in a report: the affected version, a minimal expression or snippet that reproduces the
behaviour, and the impact you believe it has. A proof of concept is welcome but not required.

## What to expect

| stage | when |
|---|---|
| acknowledgement | within 3 working days |
| assessment, including whether the report is in scope | within 10 working days |
| fix and release | as soon as a patch is ready, with the advisory published alongside it |

You are credited in the published advisory unless you ask not to be.

## Supported versions

Fixes land on the newest published minor. Older minors are not maintained.

| version | supported |
|---|---|
| 2.x | yes |
| 1.x | no |

## Scope

**In scope.** Anything that lets a crafted input step outside the act of evaluating an expression
in the caller's own process:

- a context object that reaches state it should not, such as prototype pollution that changes
  behaviour for code outside the evaluation;
- escaping the type, bean or property resolvers, including reaching a constructor, method or
  property that the supplied context did not expose;
- a denial of service that a plausibly sized expression can trigger, where the work is out of
  proportion to the input.

**Out of scope.** Evaluating an untrusted expression is this library's documented purpose, not a
vulnerability. Sandboxing the expression and the context it is given is the caller's
responsibility. A `SpelEvaluationException` raised by a malformed expression is expected
behaviour, and so is a `matches` regular expression that is slow because the caller passed a
pathological pattern with attacker-controlled input.

**Tracked, but not reported as a security issue.** An advisory in a `devDependency` that cannot
reach a published artifact. Those are covered by Dependabot and fixed on a schedule.

## What is already automated

- **Dependabot** alerts, with version updates every Monday and grouped minor and patch
  updates. Advisory-driven updates depend on the repository setting, which is not a file in
  this repository and therefore not something the text above can promise.
- **CodeQL** analysis on push, on pull requests and weekly, with the repository's ruleset refusing
  a merge while a medium-or-higher alert is open.
- The `master` branch cannot be force-pushed or deleted, and requires signed commits and one
  approving review.
