# The Guide · Design rationale

**Idea.** In every room a wolf points at one of three gates. It knows the exit but has a gate of its own, and when it lies it points there. I, the lamb, follow, listen at a gate, or go another way, and that choice is also a reply: it sets how the wolf guides me next. Does trusting a guide make you easier to use?

**Agency × Reciprocity.** Agency lives in `choose()` and the listening rule: the gate is always mine, and it only opens after the wolf has pointed, so every choice is made against something it said. Reciprocity lives in the wolf's mood. If I follow, it becomes confident and its chance of lying rises to 90%; if I catch a lie by walking through the real exit, it is ashamed and does not lie next room; otherwise it stays calm (30%). Without my choice the wolf has nothing to answer; without its answer every room is the same coin toss.

**Theory.** Wardrip-Fruin et al. (2009) treat agency as something that happens between player and system: the actions I want are among those its model supports, once my first expectations give way to an understanding of that model. So the wolf's gate is revealed at its first lie, the WOLF LOG records every room, and the wolf leans toward the real exit when it lies: the model is meant to be learnable. The limit: a fully learned model turns choosing into executing a rule.

Dubberly, Haque and Pangaro (2009) separate reaction, where the way input affects output is fixed, from interaction, where it can change. So the wolf's lie rate is not a constant; my last move sets it. Their counterpoint holds: the wolf is not a learning system. It switches moods but never changes its goal, so I learn the wolf; it never learns me.

**What I learned.** I gave it to my brother without explaining. He learned to read the wolf's body language: with `ashamed` and listening off and six gates, he still passed four of five. When I also lowered `tell`, it turned into luck. So I made the game harder: listening can now be switched off (`inspect`) and limited (`listens`, one gate per room by default).

**Live link:** https://alibicakcioglu.github.io/premise-remix/

## References

- Dubberly, H., Haque, U., & Pangaro, P. (2009). What is interaction? Are there different types? *interactions, 16*(1), 69–75. https://www.dubberly.com/articles/what-is-interaction.html
- Wardrip-Fruin, N., Mateas, M., Dow, S., & Sali, S. (2009). Agency reconsidered. In *Proceedings of DiGRA 2009*. https://doi.org/10.26503/dl.v2009i1.369 (paper: https://eis.ucsc.edu/papers/nwf-C7-digra09-agency.pdf)
