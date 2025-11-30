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
> Not all measurement error is fatal in panel data. In a Two-Way Fixed Effects (TWFE) model:
>
>   * **Constant** and **Time-Specific** additive errors are harmless (absorbed by FEs).
>   * **Unit-Specific** additive errors create bias when interacting a continuous regressor with a post-treatment dummy (Continuous DiD).
>   * **The Fix:** You can eliminate this bias by including `Unit × Post` fixed effects or by using post-period centering (FWL residualization).

---


# How to Ensure the Consistency of Estimators When Dealing with Systematic Errors in Continuous Variable Systems

## 1\. Motivation

Standard econometrics training teaches us that **classical measurement error** (random noise) in a regressor typically biases OLS estimates toward zero (attenuation bias). However, in panel data settings—specifically **Two-Way Fixed Effects (TWFE)** or **Continuous-Treatment Difference-in-Differences (DiD)** models—the mechanism is more nuanced.

Unlike random noise, **systematic measurement error** can behave differently depending on its structure:

1.  Some systematic errors are harmlessly absorbed by fixed effects.
2.  Others "leak" into interaction terms (like $A^*_{it} \times POST_t$) and generate significant bias in the parameter of interest.

This post explores the mechanics of additive systematic error, demonstrates why unit-specific errors are particularly dangerous in continuous DiD designs, and provides two computationally simple solutions.

-----

## 2\. Baseline Setup: Continuous Treatment + Two-Way FE

Consider a standard panel setup with units $i$ and time $t$.

  * **Outcome:** $y_{it}$
  * **True Continuous Treatment:** $A^*_{it}$
  * **Post-Treatment Indicator:** $POST_t$
  * **Controls:** $X_{it}$
  * **Fixed Effects:** Unit $\mu_i$ and Time $\lambda_t$

A standard continuous-treatment DiD specification is:

$$
y_{it} = \alpha + \beta_1 A^*_{it} + \beta_2 (A^*_{it} \times POST_t) + \gamma' X_{it} + \mu_i + \lambda_t + u_{it} \tag{1}
$$

**Interpretation:**

  * $\beta_1$: The baseline association between the treatment and outcome.
  * $\beta_2$: The **DiD estimand**—how the effect of $A^*_{it}$ changes after the event ($POST_t = 1$).

**The Problem:**
We do not observe the true $A^*_{it}$. Instead, we observe a noisy proxy $\widehat A_{it}$:

$$
\widehat A_{it} = A^*_{it} + \text{Error}
$$

Does using $\widehat A_{it}$ destroy our ability to estimate $\beta_2$ consistently? It depends entirely on the structure of the error.

-----

## 3\. Three Types of Systematic Additive Error

We analyze three common structures of systematic error:

1.  **Constant:** $\widehat A_{it} = A^*_{it} + \theta$
2.  **Unit-Specific:** $\widehat A_{it} = A^*_{it} + \theta_i$
3.  **Time-Specific:** $\widehat A_{it} = A^*_{it} + \theta_t$

The bias depends on how these errors interact with the fixed effects and the interaction term $A^*_{it} \times POST_t$.

### 3.1 Case 1: Constant Error (Harmless)

Suppose the measurement error is a constant shift:

$$
\widehat A_{it} = A^*_{it} + \theta \implies A^*_{it} = \widehat A_{it} - \theta
$$

Substituting this into the interaction term:

$$
A^*_{it} POST_t = (\widehat A_{it} - \theta) POST_t = \widehat A_{it} POST_t - \theta POST_t
$$

Plugging this back into the main equation (Eq 1):

$$
\begin{aligned}
y_{it} &= \alpha + \beta_1(\widehat A_{it}-\theta) + \beta_2(\widehat A_{it}POST_t-\theta POST_t) + \dots \\
&= (\alpha - \beta_1\theta) + \beta_1\widehat A_{it} + \beta_2(\widehat A_{it}POST_t) - \beta_2\theta POST_t + \dots
\end{aligned}
$$

Notice that the term $-\beta_2\theta POST_t$ varies only by time. It is perfectly collinear with the time fixed effects. We can define a re-centered time FE, $\tilde\lambda_t$:

$$
y_{it} = \tilde\alpha + \beta_1\widehat A_{it} + \beta_2(\widehat A_{it}POST_t) + \gamma'X_{it} + \mu_i + \tilde\lambda_t + u_{it} \tag{2}
$$

**Verdict:** **Consistent.** The error is absorbed by the intercept and time FEs. OLS estimates for $\beta_1$ and $\beta_2$ are unbiased.

### 3.2 Case 2: Unit-Specific Error (Harmful)

This is the most dangerous scenario. Suppose the measurement error varies by unit (e.g., firm-specific reporting bias):

$$
\widehat A_{it} = A^*_{it} + \theta_i \implies A^*_{it} = \widehat A_{it} - \theta_i
$$

The interaction term becomes:

$$
A^*_{it} POST_t = \widehat A_{it}POST_t - \theta_i POST_t
$$

Substituting into the model:

$$
y_{it} = \alpha + \beta_1\widehat A_{it} + \beta_2\widehat A_{it}POST_t + \gamma'X_{it} + \underbrace{(\mu_i - \beta_1\theta_i)}_{\tilde\mu_i} + \lambda_t + \underbrace{(u_{it} - \beta_2\theta_i POST_t)}_{\xi_{it}} \tag{3}
$$

Here we see the problem:

1.  **Main Effect ($\beta_1$):** Safe. The error $\theta_i$ is absorbed by the unit fixed effect $\tilde\mu_i$.
2.  **Interaction ($\beta_2$):** **Biased.** The composite error term $\xi_{it}$ contains $-\beta_2\theta_i POST_t$. This is correlated with the regressor $\widehat A_{it}POST_t$ (which contains $\theta_i POST_t$).

**Verdict:** **Inconsistent.** Standard TWFE fails to isolate $\beta_2$ because the measurement error creates a time-varying wedge that is specific to each unit's post-period.

### 3.3 Case 3: Time-Specific Error (Harmless)

Suppose the error varies only by time:

$$
\widehat A_{it} = A^*_{it} + \theta_t
$$

The error components generated are $-\beta_1\theta_t$ and $-\beta_2\theta_t POST_t$. Both terms depend *only* on $t$.

**Verdict:** **Consistent.** These terms are fully absorbed by the time fixed effects $\lambda_t$.

-----

## 4\. The Fix for Unit-Specific Error

In Case 2, the bias comes from the term $-\beta_2\theta_i POST_t$. This term lives in the subspace defined by the interaction of unit dummies and the post dummy.

To fix this, we simply need to control for that subspace.

### Strategy M1: Add `Unit × Post` Fixed Effects

We can explicitly add a dummy for each unit *in the post period*.

$$
y_{it} = \alpha + \beta_1\widehat A_{it} + \beta_2(\widehat A_{it}POST_t) + \dots + \mu_i + \lambda_t + \sum_{j} \phi_j (\mathbb{I}\{i=j\} \times POST_t) + e_{it}
$$

The spurious error term is a linear combination of these dummies, so the OLS estimator absorbs it into the $\phi_j$ coefficients, leaving $\beta_2$ clean.

**Implementation in Stata:**

```stata
* Generate the interaction of interest
gen a_post = a_hat * post

* Run regression including unit-specific post dummies
* c.id#1.post creates the necessary dummy interactions
reghdfe y a_hat a_post X*, absorb(id year c.id#1.post) vce(cluster id)
```

**Implementation in R (fixest):**

```r
library(fixest)

feols(
  y ~ a_hat + I(a_hat * post) + X1 + X2 |
  id + year + id:post,  # id:post absorbs the error
  data = panel_df,
  cluster = "id"
)
```

### Strategy M2: Post-Period Centering (FWL Logic)

If you prefer not to add a large number of dummy variables, you can use the Frisch–Waugh–Lovell (FWL) theorem. The equivalent "trick" is to **residualize the data against `Unit × Post`**.

This essentially means centering your variables *within the post-period for each unit*. Let $\bar{Z}_{i,\text{post}}$ be the mean of variable $Z$ for unit $i$ during the post-period. The transformation is:

$$
Z^\dagger_{it} =
\begin{cases}
Z_{it} - \bar{Z}_{i,\text{post}} & \text{if } POST_t=1 \\
Z_{it} & \text{if } POST_t=0
\end{cases}
$$

Estimating the model on this transformed data yields estimates numerically identical to Strategy M1.

-----

## 5\. Summary and Key Takeaways

The table below summarizes the impact of different systematic error structures on Continuous DiD estimates:

| Error Structure | Formula | Impact on Standard TWFE | The Fix |
| :--- | :--- | :--- | :--- |
| **Constant** | $\widehat A_{it} = A^*_{it} + \theta$ | **None.** Absorbed by intercept/time FE. | None needed. |
| **Time-specific** | $\widehat A_{it} = A^*_{it} + \theta_t$ | **None.** Absorbed by time FE. | None needed. |
| **Unit-specific** | $\widehat A_{it} = A^*_{it} + \theta_i$ | **Bias.** Interaction term $\beta_2$ is inconsistent. | Add `id × post` FE or use post-period centering. |

**Practical Implication:**
If you suspect your continuous treatment variable has unit-level systematic bias (e.g., a "sticky" measurement bias that differs by firm but is constant over time), you **must** include `id × post` fixed effects. This is not just adding flexibility; it is a necessary correction to ensure consistency.
