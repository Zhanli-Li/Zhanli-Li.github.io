---
title: "How to Ensure the Consistency of Estimators When Dealing with Systematic Errors in Continuous Variable Systems"
date: 2025-11-30
permalink: /posts/2025/11/System_error/
tags:
  - econometrics
  - measurement error
  - DID
---

> **TL;DR:**  
> Not all measurement error in a regressor is fatal in a two-way fixed-effects model.  
> Constant and time-specific additive errors can be harmless.  
> Unit-specific additive errors *are* a problem when you interact the regressor with a post-treatment dummy (continuous DID) — but you can fix them with a very simple specification tweak.

---


# How to Ensure the Consistency of Estimators When Dealing with Systematic Errors in Continuous Variable Systems

## 1\. Motivation

We all learn early on that classical measurement error in a regressor biases OLS estimates (usually towards zero). However, in panel data with fixed effects—especially in **two-way fixed effects (TWFE)** or **continuous-treatment DiD** models—the story is subtler:

  * Some types of **systematic** measurement error get absorbed by fixed effects.
  * Others "leak" into interaction terms (like $A^*_{it} \times POST_t$) and bias the parameter of interest.

This post walks through:

1.  A simple two-way FE model with a continuous "treatment" and a DiD-style interaction.
2.  Three types of **additive systematic measurement error** in the regressor.
3.  When two-way FE is sufficient, and when it fails.
4.  Two equivalent, easy-to-implement fixes:
      * Adding `unit × Post` fixed effects.
      * Using a **post-period centering** (FWL residualization) trick.

The math below is light but explicit, allowing you to adapt the logic to your own research.

-----

## 2\. Baseline Setup: Continuous Treatment + Two-Way FE

Consider a panel with units $i$ and time $t$. Let us define the variables:

  * The outcome $y_{it}$ (e.g., analyst forecast error).
  * The **true** continuous treatment $A^*_{it}$ (e.g., the true "AIGC adoption rate").
  * A post-treatment dummy $POST_t$ (e.g., 1 after the release of ChatGPT, 0 before).
  * A vector of controls $X_{it}$.
  * Unit fixed effects $\mu_i$ and time fixed effects $\lambda_t$.

A natural baseline model (continuous-treatment DiD) is given by:

$$
y_{it} = \alpha + \beta_1 A^*_{it} + \beta_2 (A^*_{it} \times POST_t) + \gamma' X_{it} + \mu_i + \lambda_t + u_{it} \tag{1}
$$

**Interpretation:**

  * The coefficient $\beta_1$ captures the "baseline" association of the treatment.
  * The coefficient $\beta_2$ captures how the effect of $A^*_{it}$ **changes after** the event ($POST_t = 1$). This is the core continuous-treatment DiD estimand.

In practice, we never observe the true $A^*_{it}$. Instead, we see a noisy proxy:

$$
\widehat A_{it} = A^*_{it} + \text{Measurement Error}
$$

The critical question is: **What happens to the estimates $\hat\beta_1$ and $\hat\beta_2$ if the measurement error has specific structures?** If the bias is significant, can we correct it without making heroic assumptions?

-----

## 3\. Three Types of Systematic Additive Measurement Error

We analyze three simple but general cases of measurement error structure:

1.  **Constant error:** $\widehat A_{it} = A^*_{it} + \theta$
2.  **Unit-specific error:** $\widehat A_{it} = A^*_{it} + \theta_i$
3.  **Time-specific error:** $\widehat A_{it} = A^*_{it} + \theta_t$

The key lies in how these errors interact with unit FE ($\mu_i$), time FE ($\lambda_t$), and critically, the interaction term $A^*_{it} \times POST_t$.

### 3.1 Case 1: Constant Error

Suppose the measurement error is a constant shift:

$$
\widehat A_{it} = A^*_{it} + \theta
$$

Substituting $A^*_{it} = \widehat A_{it} - \theta$ into the interaction term, we get:

$$
A^*_{it} POST_t = (\widehat A_{it} - \theta) POST_t = \widehat A_{it} POST_t - \theta POST_t
$$

Plugging this back into Equation (1):

$$
\begin{aligned}
y_{it} &= \alpha + \beta_1(\widehat A_{it}-\theta) + \beta_2(\widehat A_{it}POST_t-\theta POST_t) + \gamma'X_{it} + \mu_i + \lambda_t + u_{it} \\
&= (\alpha - \beta_1\theta) + \beta_1\widehat A_{it} + \beta_2(\widehat A_{it}POST_t) - \beta_2\theta POST_t + \gamma'X_{it} + \mu_i + \lambda_t + u_{it}
\end{aligned}
$$

Notice that the term $-\beta_2\theta POST_t$ depends only on time. We can define a *re-centered* time fixed effect:

$$
\tilde\lambda_t := \lambda_t - \beta_2\theta POST_t
$$

and a new intercept $\tilde\alpha := \alpha - \beta_1\theta$. The model becomes:

$$
y_{it} = \tilde\alpha + \beta_1\widehat A_{it} + \beta_2(\widehat A_{it}POST_t) + \gamma'X_{it} + \mu_i + \tilde\lambda_t + u_{it} \tag{2}
$$

This is functionally identical to estimating the standard model.

**Conclusion (Case 1):**
If the measurement error is a **constant shift**, and the model includes time fixed effects, the OLS estimates for $\beta_1$ and $\beta_2$ using $\widehat A_{it}$ remain **consistent**. The error is simply absorbed by the intercept and time FEs.

-----

### 3.2 Case 2: Unit-Specific Error

This is the most dangerous case. Suppose the error varies by unit:

$$
\widehat A_{it} = A^*_{it} + \theta_i
$$

We have:

  * $A^*_{it} = \widehat A_{it} - \theta_i$
  * $A^*_{it} POST_t = \widehat A_{it}POST_t - \theta_i POST_t$

Plugging into Equation (1):

$$
\begin{aligned}
y_{it} &= \alpha + \beta_1(\widehat A_{it}-\theta_i) + \beta_2(\widehat A_{it}POST_t-\theta_i POST_t) + \gamma'X_{it} + \mu_i + \lambda_t + u_{it} \\
&= \alpha - \beta_1\theta_i + \beta_1\widehat A_{it} + \beta_2\widehat A_{it}POST_t - \beta_2\theta_i POST_t + \gamma'X_{it} + \mu_i + \lambda_t + u_{it}
\end{aligned}
$$

Let us absorb the level error into the unit fixed effect by defining $\tilde\mu_i := \mu_i - \beta_1\theta_i$. The model becomes:

$$
y_{it} = \alpha + \beta_1\widehat A_{it} + \beta_2\widehat A_{it}POST_t + \gamma'X_{it} + \tilde\mu_i + \lambda_t + \underbrace{\bigl(u_{it} - \beta_2\theta_i POST_t\bigr)}_{\xi_{it}} \tag{3}
$$

We observe two key facts:

1.  **Levels are safe:** The unit FE absorbs $\theta_i$ in the main effect. $\beta_1$ is unbiased.
2.  **Interaction is biased:** The regressor is $\widehat A_{it}POST_t$, which contains $A^*_{it}POST_t + \theta_i POST_t$. The composite error term $\xi_{it}$ contains $-\beta_2\theta_i POST_t$.

Because both the regressor and the error term depend on $\theta_i POST_t$, they are correlated:

$$
\operatorname{Cov}(\widehat A_{it}POST_t, \xi_{it}) \neq 0
$$

**Conclusion (Case 2):**
With **unit-specific** additive error, standard two-way FE **does not** fix the bias in $\beta_2$. The continuous DiD effect is generally **inconsistent**.

-----

### 3.3 Case 3: Time-Specific Error

Suppose the error varies only by time:

$$
\widehat A_{it} = A^*_{it} + \theta_t
$$

Substituting terms, the error components become $-\beta_1\theta_t$ and $-\beta_2\theta_t POST_t$. Since these depend *only* on $t$, they can be fully absorbed into a redefined time fixed effect:

$$
\tilde\lambda_t = \lambda_t - \beta_1\theta_t - \beta_2\theta_t POST_t
$$

**Conclusion (Case 3):**
Purely **time-specific** additive errors are absorbed by time fixed effects. The estimates $\hat\beta_1$ and $\hat\beta_2$ remain consistent.

-----

## 4\. Fixing the Unit-Specific Error: Two Equivalent Tricks

The problematic term in Case 2 is $-\beta_2\theta_i POST_t$. This term exists in the subspace defined by the interaction of unit dummies and the post dummy:

$$
G_{it} := \mathbb{I}\{i\} \times POST_t
$$

This represents "unit $i$ in the post period." The logic for the fix is simple: **If the bias lives in the `unit × Post` subspace, add that subspace to the model or project it out.**

### 4.1 Strategy M1: Add Unit × Post Fixed Effects

We can explicitly add a dummy for each unit's post period. Let $G_{it}^j = \mathbb{I}\{i=j\} \cdot POST_t$. We estimate:

$$
y_{it} = \alpha + \beta_1\widehat A_{it} + \beta_2(\widehat A_{it}POST_t) + \gamma'X_{it} + \mu_i + \lambda_t + \sum_{j} \phi_j G_{it}^j + e_{it} \tag{4}
$$

**Intuition:**
The spurious term is a deterministic linear combination of $G_{it}^j$, so the OLS estimator absorbs it into the coefficients $\phi_j$. The remaining error $e_{it}$ is clean.

**Implementation (Stata):**

```stata
* Generate the interaction
gen a_post = a_hat * post

* Run regression with Unit x Post FE
* c.id#post creates the unit-specific post dummies
reghdfe y a_hat a_post X*, absorb(id year c.id#post) vce(cluster id)
```

**Implementation (R - fixest):**

```r
library(fixest)

feols(
  y ~ a_hat + I(a_hat * post) + X1 + X2 |
  id + year + id:post,  # id:post adds the FE
  data = panel_df,
  cluster = "id"
)
```

-----

### 4.2 Strategy M2: Post-Period Centering / FWL Residualization

If you prefer not to add thousands of dummies, the Frisch–Waugh–Lovell (FWL) theorem offers an equivalent path: **Residualize all variables with respect to the `unit × Post` dummies.**

This is effectively a **post-period centering**. For any variable $Z$, we calculate its post-period mean for unit $i$, denoted as $\bar{Z}_{i,\text{post}}$. The transformed variable $Z^\dagger$ is:

$$
Z^\dagger_{it} =
\begin{cases}
Z_{it} - \bar{Z}_{i,\text{post}} & \text{if } POST_t=1 \\
Z_{it} & \text{if } POST_t=0
\end{cases}
$$

We then estimate the standard model on the transformed data:

$$
y^\dagger_{it} = \alpha^\dagger + \beta_1 \widehat A^\dagger_{it} + \beta_2 (\widehat A POST)^\dagger_{it} + \gamma' X^\dagger_{it} + \mu_i^\dagger + \lambda_t^\dagger + \varepsilon^\dagger_{it} \tag{5}
$$

**Result:** The estimates for $\beta_1$ and $\beta_2$ from Strategy M2 are numerically identical to Strategy M1.

-----

## 5\. Connection to "Continuous DiD"

The derivations above are framed as a regression problem, but they describe the exact challenge in **continuous-treatment DiD**:

1.  $A^*_{it}$ is the intensity of treatment.
2.  $\beta_2$ measures the change in marginal effect after the policy shock.

**Key Takeaways for Practitioners:**

  * If your treatment measure has **constant** or **time-specific** errors, standard two-way FE is safe.
  * If your treatment measure has **unit-specific** errors (e.g., a detector-based index that is consistently biased high for some firms and low for others), standard estimates of $\beta_2$ are biased.
  * To fix this, you must control for **unit-specific shifts in the post period** (via explicit FEs or centering).

This provides a rigorous justification for including `id × post` fixed effects: it is not just "flexibility," it is a correction for unit-specific measurement error that becomes problematic only when interacted with the time dummy.

-----

## 6\. Recap

| Error Structure | Formula | Impact on Standard TWFE | Fix |
| :--- | :--- | :--- | :--- |
| **Constant** | $\widehat A_{it} = A^*_{it} + \theta$ | **None.** Absorbed by intercept/time FE. | None needed. |
| **Time-specific** | $\widehat A_{it} = A^*_{it} + \theta_t$ | **None.** Absorbed by time FE. | None needed. |
| **Unit-specific** | $\widehat A_{it} = A^*_{it} + \theta_i$ | **Bias.** Interaction term $\beta_2$ is inconsistent. | Add `id × post` FE or use post-period centering. |

This logic uses standard linear algebra and fixed-effects machinery to provide a clean, operational recipe for handling measurement error in modern panel designs.
