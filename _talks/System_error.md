
---
title: "Fixing Systematic Measurement Error in Two-Way FE and Continuous DID"
collection: talks
type: "Talk"
permalink: /talks/System_error
venue: "Wenlan School of Business, ZUEL"
date: 2025-11-30
location: "Wuhan, China"
---

> **TL;DR:**  
> Not all measurement error in a regressor is fatal in a two-way fixed-effects model.  
> Constant and time-specific additive errors can be harmless.  
> Unit-specific additive errors *are* a problem when you interact the regressor with a post-treatment dummy (continuous DID) — but you can fix them with a very simple specification tweak.

---

## 1. Motivation

We all learn early that classical measurement error in a regressor biases OLS.  
But in panel data with fixed effects — especially in **two-way FE** or **continuous‑treatment DID** — the story is subtler:

- Some types of **systematic** measurement error get absorbed by fixed effects.
- Others leak into interaction terms (like $A^*_{it} \times POST_t$) and bias the parameter you actually care about.

This post walks through:

1. A simple two-way FE model with a continuous “treatment” and a DID-style interaction.
2. Three types of **additive systematic measurement error** in the regressor.
3. When two-way FE is enough, and when it isn’t.
4. Two equivalent, easy-to-implement fixes:
   - Add `unit × Post` fixed effects.
   - Or, do a **post-period centering** / FWL residualization trick.

The math is light but explicit, so you can copy-paste the logic into your own work.

---

## 2. Baseline setup: continuous treatment + two-way FE

Consider a panel with units $i$ and time $t$. Think of

- $y_{it}$: outcome (e.g., analyst forecast error),
- $A^*_{it}$: **true** continuous treatment (e.g., “true AIGC rate” in a report),
- $POST_t$: post-treatment dummy (e.g., 1 after ChatGPT appears, 0 before),
- $X_{it}$: controls,
- $\mu_i$: unit fixed effects,
- $\lambda_t$: time fixed effects.

A natural baseline model (continuous-treatment DID) is:

$$
y_{it}
= \alpha
+ \beta_1 A^*_{it}
+ \beta_2 (A^*_{it} \times POST_t)
+ \gamma' X_{it}
+ \mu_i + \lambda_t
+ u_{it}.
\tag{1}
$$

Interpretation:

- $\beta_1$ captures the “baseline” association of the treatment.
- $\beta_2$ captures how the effect of $A^*_{it}$ **changes after** $POST_t = 1$.  
  That’s the continuous-treatment DID piece.

In practice we never see $A^*_{it}$. We see a noisy proxy:

$$
\widehat A_{it} = A^*_{it} + \text{(measurement error)}.
$$

The question is: **what happens to $\hat\beta_1, \hat\beta_2$ if the measurement error is structured in different ways?**  
And if it’s bad, can we fix it without heroic assumptions?

---

## 3. Three types of systematic additive measurement error

We’ll look at three simple but surprisingly general cases:

1. **Constant error**  
   $\widehat A_{it} = A^*_{it} + \theta$
2. **Unit-specific error**  
   $\widehat A_{it} = A^*_{it} + \theta_i$
3. **Time-specific error**  
   $\widehat A_{it} = A^*_{it} + \theta_t$

The key is how these interact with:

- unit FE ($\mu_i$),
- time FE ($\lambda_t$),
- and especially the interaction $A^*_{it} \times POST_t$.

---

### 3.1 Case 1: Constant error $\widehat A_{it} = A^*_{it} + \theta$

Plug into (1):

- $A^*_{it} = \widehat A_{it} - \theta$
- $A^*_{it} POST_t = (\widehat A_{it} - \theta) POST_t = \widehat A_{it} POST_t - \theta POST_t$.

Substitute:

$$
\begin{aligned}
y_{it}
&= \alpha
+ \beta_1(\widehat A_{it}-\theta)
+ \beta_2(\widehat A_{it}POST_t-\theta POST_t)
+ \gamma'X_{it}
+ \mu_i + \lambda_t
+ u_{it} \\
&= (\alpha - \beta_1\theta)
+ \beta_1\widehat A_{it}
+ \beta_2(\widehat A_{it}POST_t)
- \beta_2\theta POST_t
+ \gamma'X_{it}
+ \mu_i + \lambda_t
+ u_{it}.
\end{aligned}
$$

Define a *re-centered* time FE

$$
\tilde\lambda_t := \lambda_t - \beta_2\theta POST_t,
$$

and a new intercept $\tilde\alpha := \alpha - \beta_1\theta$. Then

$$
y_{it}
= \tilde\alpha
+ \beta_1\widehat A_{it}
+ \beta_2(\widehat A_{it}POST_t)
+ \gamma'X_{it}
+ \mu_i + \tilde\lambda_t
+ u_{it}.
$$

This is exactly the same as estimating

$$
y_{it}
= a
+ b_1\widehat A_{it}
+ b_2(\widehat A_{it}POST_t)
+ \delta'X_{it}
+ \mu_i + \lambda_t
+ \varepsilon_{it},
\tag{2}
$$

just with reparameterized intercept and time FE.

**Conclusion (Case 1).**

- If the only measurement error is a **constant shift** $\theta$,
- and model (1) is correctly specified, with two-way FE,
- then FE-OLS estimates of $\beta_1, \beta_2$ using $\widehat A_{it}$ remain **consistent**.

The error just gets absorbed into the intercept and time FE.

---

### 3.2 Case 2: Unit-specific error $\widehat A_{it} = A^*_{it} + \theta_i$

This is the interesting (and dangerous) one.

Now:

- $A^*_{it} = \widehat A_{it} - \theta_i$,
- $A^*_{it} POST_t = \widehat A_{it}POST_t - \theta_i POST_t$.

Plug into (1):

$$
\begin{aligned}
y_{it}
&= \alpha
+ \beta_1(\widehat A_{it}-\theta_i)
+ \beta_2(\widehat A_{it}POST_t-\theta_i POST_t)
+ \gamma'X_{it}
+ \mu_i + \lambda_t
+ u_{it} \\
&= \alpha - \beta_1\theta_i
+ \beta_1\widehat A_{it}
+ \beta_2\widehat A_{it}POST_t
- \beta_2\theta_i POST_t
+ \gamma'X_{it}
+ \mu_i + \lambda_t
+ u_{it}.
\end{aligned}
$$

Define

$$
\tilde\mu_i := \mu_i - \beta_1\theta_i
$$

and rewrite:

$$
y_{it}
= \alpha
+ \beta_1\widehat A_{it}
+ \beta_2\widehat A_{it}POST_t
+ \gamma'X_{it}
+ \tilde\mu_i + \lambda_t
+ \underbrace{\bigl(u_{it} - \beta_2\theta_i POST_t\bigr)}_{\xi_{it}}.
\tag{3}
$$

We now have two key observations:

1. **Unit FE will kill $\theta_i$ in the *level* term.**  
   After within-transformation, $\theta_i$ no longer appears in $\widehat A_{it}$. So $\beta_1$ is still OK.
2. But for the interaction:
   $$
   \widehat A_{it}POST_t
   = A^*_{it}POST_t + \theta_i POST_t.
   $$
   At the same time, the error term contains $-\beta_2\theta_i POST_t$.  

   So $\widehat A_{it}POST_t$ and $\xi_{it}$ **share the same $\theta_i POST_t$ component**. That is,
   $$
   \operatorname{Cov}(\widehat A_{it}POST_t,\xi_{it}) \neq 0
   $$
   whenever $\beta_2 \neq 0$ and $\operatorname{Var}(\theta_i)>0$.

**Conclusion (Case 2).**

- With unit-specific additive measurement error $\theta_i$,
- two-way FE **does not** fix the bias in $\beta_2$ (the interaction coefficient).
- The continuous DID effect is **generally inconsistent** if you just regress on $\widehat A_{it}$ and $\widehat A_{it}POST_t$ with unit and time FE.

We need an extra move.

---

### 3.3 Case 3: Time-specific error $\widehat A_{it} = A^*_{it} + \theta_t$

This is very similar: for each $t$,

- $A^*_{it} = \widehat A_{it} - \theta_t$,
- $A^*_{it} POST_t = \widehat A_{it}POST_t - \theta_t POST_t$.

Plug in and collect terms:

$$
-\beta_1\theta_t - \beta_2\theta_t POST_t
$$

depends only on $t$, so it can be absorbed into a **redefined** time FE:

$$
\tilde\lambda_t
= \lambda_t - \beta_1\theta_t - \beta_2\theta_t POST_t.
$$

Again we land in a model of form (2) with the same $\beta_1, \beta_2$.

**Conclusion (Case 3).**

- Purely **time-specific additive errors** in the regressor can be absorbed by time FE.
- $\hat\beta_1, \hat\beta_2$ remain consistent under the usual FE assumptions.

---

## 4. Fixing the unit-specific error: two equivalent tricks

The problematic term is $-\beta_2\theta_i POST_t$. It lives in the span of the dummy variables:

$$
G_{it} := \mathbb{I}\{i\} \times POST_t
$$

i.e. “**unit $i$ in the post period**”. The idea is very simple:

> If the bias lives in the `unit × Post` subspace,  
> **add that subspace explicitly to the model, or project it out.**

These give two algebraically equivalent strategies:

1. Add **unit × Post fixed effects** (M1).
2. Or, residualize all variables with respect to those dummies (= **post-period centering**, M2).

---

### 4.1 Strategy M1: add unit × Post FE

Augment the model with one dummy for each unit’s post period:

$$
G_{it}^j := \mathbb{I}\{i=j\} \cdot POST_t,\quad j = 1,\dots,N.
$$

Estimate

$$
y_{it}
= \alpha
+ \beta_1\widehat A_{it}
+ \beta_2(\widehat A_{it}POST_t)
+ \gamma'X_{it}
+ \mu_i + \lambda_t
+ \sum_{j} \phi_j G_{it}^j
+ e_{it}.
\tag{4}
$$

Intuition:

- The spurious term $-\beta_2\theta_i POST_t$ is a **deterministic linear combination** of the $G_{it}^j$.  
  So it gets absorbed into the $\phi_j$'s by OLS.
- What’s left in $e_{it}$ is just the “good” noise $u_{it}$ (up to innocuous linear transformation).
- As long as the original model (1) satisfied the usual FE assumptions,  
  $\hat\beta_1, \hat\beta_2$ from (4) are **consistent**.

#### Implementation Sketches

**Stata-style pseudocode**

```stata
* Suppose a_hat is the mismeasured regressor
* post is the post-treatment dummy

gen a_post = a_hat * post

* Two-way FE + unit×post
reghdfe y a_hat a_post X*, absorb(id year c.id#post) vce(cluster id)
```

**R (fixest)**

```r
library(fixest)

feols(
  y ~ a_hat + I(a_hat * post) + X1 + X2 |
    id + year + id:post,
  data = panel_df,
  cluster = "id"
)
```

The `id:post` fixed effect is exactly the unit × Post term.

---

### 4.2 Strategy M2: post-period centering / FWL residualization

Sometimes you don’t want to literally add thousands of dummies.  
The Frisch–Waugh–Lovell (FWL) theorem tells you there is an equivalent route:

Residualize all variables with respect to the unit × Post dummies,  
then run the regression on the residuals.

Define the projection onto the column space of $G$ (all id×post dummies) as $P_G$, and the residual maker as $M_G = I - P_G$. For any variable $Z$, let

$$
Z^\dagger := M_G Z.
$$

Concretely, this becomes a simple post-period centering:

- For each unit $i$, compute its post-period mean $\bar{Z}_{i,\text{post}}$.
- Then set

$$
Z^\dagger_{it} =
\begin{cases}
Z_{it} - \bar{Z}_{i,\text{post}}, & \text{if } POST_t=1, \\
Z_{it}, & \text{if } POST_t=0.
\end{cases}
$$

Apply this to all variables in the regression:  
$(y, \widehat A, \widehat A POST, X)$.

Then estimate the usual two-way FE model on the transformed data:

$$
y^\dagger_{it}
= \alpha^\dagger
+ \beta_1 \widehat A^\dagger_{it}
+ \beta_2 (\widehat A POST)^\dagger_{it}
+ \gamma' X^\dagger_{it}
+ \mu_i^\dagger + \lambda_t^\dagger
+ \varepsilon^\dagger_{it}.
\tag{5}
$$

FWL guarantees that $\hat\beta_1, \hat\beta_2$ from (5) are numerically identical to those from (4). You’ve just done the “dummies regression” implicitly.

**Implementation intuition**

In code, you typically don’t implement (5) manually; you let the estimator handle it. But conceptually:

- M1 = add id×post FE explicitly.
- M2 = subtract id×post means from all variables and then do a standard FE.

They are the same for $\beta$.

---

## 5. How does this relate to “continuous DID”?

Everything above was framed in a standard two-way FE regression with an interaction. That’s exactly the continuous DID setting:

- $A^*_{it}$ is a continuous treatment intensity,
- $POST_t$ turns on at some date,
- $\beta_2$ measures how the marginal effect of the treatment shifts after the policy shock.

The key takeaways for this context:

1. If your treatment measure has constant or purely time-specific additive error, two-way FE already absorbs it. No extra work needed.
2. If your treatment measure has unit-specific additive error, and you interact it with a post dummy, then:
   - Vanilla two-way FE does not guarantee a consistent estimate of the DID effect $\beta_2$.
   - You can restore consistency under the same structural assumptions by:
     - adding unit × post fixed effects (M1), or
     - equivalently, residualizing with respect to those dummies (M2).

From a practice-oriented DID perspective:

- What people often write as “allowing unit-specific post shifts” can be reinterpreted as  
  **correcting for unit-specific measurement error that only bites in the post period**.

Which is a nice way to justify those extra fixed effects when your “treatment” is a detector-based index, a noisy score, or any construct where unit-level mis-calibration is plausible.

---

## 6. Recap

Let’s summarize the punchlines:

- **Model:**  
  Two-way FE with a continuous regressor $A^*_{it}$ and interaction $A^*_{it} \times POST_t$.
- **Measurement error structures:**
  - **Constant:** $\widehat A_{it} = A^*_{it} + \theta$ → harmless, absorbed into intercept/year FE.
  - **Time-specific:** $\widehat A_{it} = A^*_{it} + \theta_t$ → harmless, absorbed into year FE.
  - **Unit-specific:** $\widehat A_{it} = A^*_{it} + \theta_i$ → dangerous for $\beta_2$, because the interaction picks up $\theta_i POST_t$.
- **Fix for unit-specific error:**
  - **Explicit:** add unit × post fixed effects.
  - **Implicit:** residualize variables with respect to unit × post (FWL / post-period centering).

All of this uses only very standard linear algebra and fixed-effects machinery — no fancy estimators — but it gives you a clean, operational recipe for dealing with structured measurement error in continuous-treatment DID designs.
