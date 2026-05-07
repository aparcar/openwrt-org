---
title: "Switch 'master' to 'main' branch for repositories"
date: 2023-02-27
started_by: "Felix"
subjects:
  - { key: "vote", label: "Vote" }
proposal: |
  More and more projects are switching their repositories to use the 'main' branch instead of the 'master' branch. This also includes many Linux upstream trees as well. Some trees are even removing their 'master' branches already.

  I think this is becoming more and more mainstream and expected of projects, so we should do the same.

  I would like to propose the following:

  1. Change the git server side to automatically update the 'master' branch, whenever an update is pushed to 'main'.
  It's important to have a long transition period in order to avoid breaking downstream users' workflows.

  2. Change the git server side to refuse a push to 'master' if 'main' exists. This avoid accidental branch divergence

  3. Developers simply change their git configs to always push to 'main'

  Once this change is well established, we can look into removing 'master', but we should definitely take our time with that.

  Voting is open until 20. March 2023.
votes:
  - name: "Adrian"
    vote: -1
  - name: "Alexander"
    vote: 1
  - name: "Álvaro"
  - name: "Baptiste"
  - name: "Christian L."
    vote: 1
  - name: "Christian M."
    vote: 0
  - name: "Chuanhong"
    vote: -1
  - name: "Daniel"
    vote: 1
  - name: "David B."
    vote: 0
  - name: "David W."
    vote: 1
  - name: "Felix"
    vote: 1
  - name: "Florian"
  - name: "Hans"
    vote: -1
  - name: "Hauke"
    vote: 1
  - name: "Imre"
    vote: -1
  - name: "Jo-Philipp"
    vote: -1
  - name: "John"
    vote: 1
  - name: "Jonas"
    vote: 1
  - name: "Kevin"
  - name: "Koen"
  - name: "Luka"
    vote: 1
  - name: "Mathias"
  - name: "Matthias"
    vote: 1
  - name: "Mirko"
    vote: 1
  - name: "Paul"
    vote: 1
  - name: "Petr"
  - name: "Piotr"
    vote: 0
  - name: "Rafał"
    vote: -1
  - name: "Rich"
    vote: 1
  - name: "Rui"
    vote: 1
  - name: "Steven"
  - name: "Stijn"
    vote: -1
  - name: "Sungbo"
    vote: 0
  - name: "Sander"
    vote: 1
  - name: "Ted"
    vote: -1
  - name: "Thomas"
  - name: "Yousong"
    vote: -1
  - name: "Zoltan"
    vote: -1
---
