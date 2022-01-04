# Contributing to Livepeer.com

Hey there, potential contributor!

Thanks for your interest in this project. Every contribution is welcome and
appreciated. We're super excited to help you to get started 😎

> **Note:** If you still have questions after reading through this guide,
> [open an issue](https://github.com/livepeer/livepeer-com/issues) or
> [talk to us on Discord](https://discordapp.com/invite/7wRSUGX).

## Getting Started

First off, here are a few important notes:

- **Read the
  [Code of Conduct](https://github.com/livepeer/livepeer-com/blob/master/CODE_OF_CONDUCT.md).**
  For most, this will be common sense. But please take a couple minutes to
  understand your responsibilities as a member of the Livepeer.com community and
  how you are expected to treat others.
- **[Yarn](https://yarnpkg.com/en/) is the npm client used in this project.**
  Please do not use `npm` or you will encounter issues.
- **This is a monorepo.** This means several public and private packages are
  contained within this single repository. Do your best to isolate your code
  changes to a single subpackage for each commit.
- **We use Typescript.** While not required, please try your best to add types.
- **Packages use fixed-versioning.** When packages are published, their version
  numbers are synchronized. Perhaps we could switch over to independent
  versioning at some point, but this approach was simpler for getting started.
- **Version numbers and changelogs are scripted.** Conveniently, there's no need
  to manually update any changelogs or package versions manually. This is all
  managed under-the-hood by commitizen when maintainers create a new release.
- **Always be rebasing.** We tend to prefer a nice linear trail of commits in
  our Git history. Merge commits throw that off and make us 😰😰😰. To minimize
  conflicts, please
  `git remote add livepeer https://github.com/livepeer/livepeer-com.git` so you
  can `git fetch livepeer && git rebase livepeer/master` often. And if your fork
  is far behind HEAD, consider deleting it and re-forking or using
  [`git rebase --onto`](https://stackoverflow.com/a/29916361).
- **There are a couple fancy pre-commit hooks:**.
  - **Style linting.** This gets handled by prettier. So you don't have to count
    the number of spaces or tabs your are using when you code, etc.
  - **Commit message formatting.** We use the conventional commit format.
    Because it can be annoying to type out manually, you can simply run
    `yarn cz` whenever you are ready to commit your staged files.

### How You Can Help

Livepeer.com contributions will generally fall into one of the following
categories:

#### 📖 Updating documentation

This could be as simple as adding some extra notes to a README.md file, or as
complex as creating some new `package.json` scripts to generate docs. Either
way, we'd really really love your help with this 💖. Look for
[open documentation issues](https://github.com/livepeer/livepeer-com/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%93%96+documentation%22),
create your own, or just submit a PR with the updates you want to see.

#### 💬 Getting involved in issues

Many issues are open discussions. Feel free to add your own concerns, ideas, and
workarounds. If you don't see what you're looking for, you can always open a new
issue. Check out some of the
[open discussions](https://github.com/livepeer/livepeer-com/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%92%AC+Discussion%22)
and
[good first issues](https://github.com/livepeer/livepeer-com/issues?q=is%3Aissue+is%3Aopen+label%3A%22%F0%9F%98%8B+good+first+issue%22).

#### 🐛 Fixing bugs, 🕶️ adding feature/enhancements, or 👌 improving code quality

If you're into this whole coding thing, maybe try fixing a
[bug](https://github.com/livepeer/livepeer-com/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22),
tackling an
[enhancement](https://github.com/livepeer/livepeer-com/issues?q=is%3Aissue+is%3Aopen+label%3A%22%E2%9E%95+enhancement%22),
or taking on a
[feature request](https://github.com/livepeer/livepeer-com/labels/%F0%9F%95%B6%20feature).

If picking up issues isn't your thing, no worries -- you can always add more
tests to improve coverage or refactor code to increase maintainability. Check
out Code Climate for some insight into
[code quality & coverage](https://codeclimate.com/github/livepeer/livepeer-com/issues)
on a file-by-file basis. Whatever you do, be sure to check out the section about
[useful tools](#useful-tools).

> Note: Bonus points if you can delete code instead of adding it! 👾

#### 🛠️ Updating scripts and tooling

We want to make sure Livepeer.com contributors have a pleasant developer
experience (DX). The tools we use to code continually change and improve. If you
see ways to reduce the amount of repetition or stress when it comes to coding in
this project, feel free to create an issue and/or PR to discuss. Let's continue
to improve this codebase for everyone.

> Note: These changes generally affect multiple packages, so you'll probably
> want to be familiar with each project's layout and conventions. Because of
> this additional cognitive load, you may not want to begin here for you first
> contribution.

## FAQ

### How can I run Livepeer.com on Windows?

You need a unix shell to run Livepeer.com. You can get one on Windows by
installing the Linux on Windows subsystem on Windows 10. You can find
instructions [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10).

### How is a contribution reviewed and accepted?

- **If you are opening an issue...**

  - Fill out all required sections for your issue type. Issues that are not
    filled out properly will be flagged as `invalid` and will be closed if not
    updated.
  - _Keep your issue simple, clear, and to-the-point_. Most issues do not
    require many paragraphs of text. In fact, if you write too much, it's
    difficult to understand what you are actually trying to communicate.
    **Consider
    [starting a discussion](https://github.com/livepeer/livepeer-com/issues/new?template=Custom.md)
    if you're not clear on something or want feedback from the community.**

- **If you are submitting a pull request...**
  - Write tests to increase code coverage
  - Tag the issue(s) your PR is closing or relating to
  - Make sure your PR is up-to-date with `livepeer/master` (rebase please 🙏)
  - Wait for a maintainer to review your PR
  - Push additional commits to your PR branch to fix any issues noted in review.
  - Wait for a maintainer to merge your PR

Code reviews happen each week, so a PR that follows these guidelines will
probably get merged quickly if there aren't any major problems with the
implementation (we try to watch out for code duplication/complexity). CoacoaPods
has
[some really useful tips](https://github.com/CocoaPods/CocoaPods/wiki/Communication-&-Design-Rules#design-rules)
when it comes to coding. I highly recommend taking a look 🤓.

### When is it appropriate to follow up?

You can expect a response from a maintainer within 7 days. If you haven’t heard
anything by then, feel free to ping the thread.

### What types of contributions are accepted?

All of the types outlined in [How You Can Help](#how-you-can-help).

### What happens if my suggestion or PR is not accepted?

While it's unlikely, sometimes there's no acceptable way to implement a
suggestion or merge a PR. If that happens, maintainer will still...

- Thank you for your contribution.
- Explain why it doesn’t fit into the scope of the project and offer clear
  suggestions for improvement, if possible.
- Link to relevant documentation, if it exists.
- Close the issue/request.

But do not despair! In many cases, this can still be a great opportunity to
follow-up with an improved suggestion or pull request. Worst case, this repo is
open source, so forking is always an option 😎
