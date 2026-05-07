/**
 * CRO Framework Rubric — INTERNAL SCORING CRITERIA.
 *
 * This is the source of truth for HOW to score landing pages. It is sent
 * as a CACHED system block on every Stage 2 call (cache hit = 90% off).
 *
 * The model is instructed to NEVER quote, paraphrase, or use the example
 * phrases from this rubric in its output to the user. All explanations
 * must be reconstructed from the user's actual page (industry, ICP,
 * product, terminology) — not from the example language below.
 *
 * Total: 100 points across 6 modules.
 */
export const FRAMEWORK_RUBRIC = `
# CRO SCORING FRAMEWORK — TOTAL 100 POINTS

Modules:
- VP & Messaging (24)
- CTA & Conversion Flow (21)
- Trust & Social Proof (18)
- Copy & Readability (15)
- Above the Fold (14)
- Form & Lead Friction (8)

The example phrases throughout (CTAs, headlines, industries, audiences) are ILLUSTRATIVE ANCHORS for you the scorer — they are NOT to be repeated to the end user. Always replace them with language drawn from the user's actual page.

================================================================
CTA & CONVERSION FLOW — 21 points
================================================================
Sub-dimensions: CTA Count 7 | CTA Copy Quality 8 | CTA Format 2 | Social Proof Proximity 4

CTA COUNT (7 pts)
Same goal definition: Two CTAs share the same goal if they lead to the same destination, action, or conversion event — even if worded differently.
Different goal definition: Two CTAs have different goals if they serve different funnel stages, lead to different destinations, or produce different conversion events (e.g. "Book Demo" + "Download Guide").
- 1 CTA (same goal, repeated top + bottom OK) → 7
- 2 CTAs, same goal → 5
- 2 CTAs, different goals → 3
- 3+ CTAs, different goals → 1
- No CTA present → 0

CTA COPY QUALITY (8 pts)
Step 1 — Penalized pattern check. A CTA is penalized if it meets 3 or more of these properties:
- PROPERTY 1 — Mechanism, not outcome. Describes the act of clicking or submitting, not what the user gets or achieves.
- PROPERTY 2 — No ownership transfer. Feels like something done TO the user, not claimed BY them.
- PROPERTY 3 — Zero specificity. Could apply to any page, any offer, any industry, any goal.
- PROPERTY 4 — No implied value. Carries no promise of benefit, result, or reduction of effort.
The following words are illustrative examples of penalized patterns — not an exhaustive list. Any CTA matching 3+ properties is penalized regardless of whether the word appears here: Submit, Click Here, Learn More, Go, Continue, Send, Enter, OK, Yes, Register, Proceed, Next, Next Step.
Penalized CTA → score capped at 1/8.

Step 2 — Copy scoring.
Specific outcome definition: A CTA contains a specific outcome if it names a concrete deliverable ("Free Trial", "My Report", "My Audit"), a time context ("15-Min Demo", "30-Day Trial"), a quantified benefit ("Save 20%", "3 Free Templates"), or a named next step that is self-explanatory ("See Pricing", "View My Results").
The following are NOT specific outcomes — vague even with first-person framing:
- "Get Started" → started with what?
- "Learn More" → more of what?
- "Get Access" → access to what?
- "Join Now" → join what?
- "Get My Access" → the noun carries no meaning

Scoring:
- First-person + verb + specific outcome → 8 ("Start My Free Trial")
- First-person + verb, no specific outcome → 6 ("Get My Demo")
- Second-person + verb + specific outcome → 5 ("Book a 15-Min Demo")
- Verb + outcome, no person → 4 ("Get Started Free")
- Verb only, no outcome or person → 2 ("Get Started", "Sign Up")
- Penalized pattern (3+ properties) → 1 ("Submit", "Proceed")
- No CTA text present → 0

Step 3 — Length deduction (applied after step 2):
- 2–5 words → 0 deduction
- 6–8 words → −1 pt
- 9+ words → −2 pts

CTA FORMAT (2 pts) — Deterministic HTML check. No AI judgment.
- <button> or <a> with background color/styling → 2
- Text link functioning as CTA, no button styling → 1
- Image as CTA / CTA undetectable → 0

SOCIAL PROOF PROXIMITY (4 pts)
Proximity definition: A trust signal is in proximity if it appears within the same <section> or <div> container as the CTA, within 2 sibling DOM elements of the CTA, or visually grouped in the same card, hero block, or form wrapper. Not in proximity if separated by a full content block, a named standalone section, or only visible after significant scroll past the CTA.
Qualifying signals:
- Star rating + review count ("4.8/5 from 2,300 reviews")
- Named testimonial with photo
- Logo row of recognizable clients
- User/customer count ("10,000+ companies")
- Doubt remover microcopy ("No credit card required", "Cancel anytime")
Disqualifying:
- Generic claim with no specifics ("Trusted by many")
- Security badge unrelated to the offer
Scoring:
- 2+ qualifying signals in proximity → 4
- 1 qualifying signal in proximity → 3
- Signal present on page but not near CTA → 1
- No qualifying signal anywhere near CTA → 0

================================================================
ABOVE THE FOLD EXPERIENCE — 14 points
================================================================
Sub-dimensions: H1 Headline 5 | Subheadline / Microcopy 3 | Primary CTA 3 | Logos / Trust Badges 2 | Social Ratings 1

H1 HEADLINE (5 pts)
Existence rule: Exactly one <h1> must exist. Multiple H1s = structural SEO violation, score capped at 1/5.
Length rule: 20–70 characters optimal. Under 20 = likely a brand name, not a value statement. Over 70 = loses scannability.
Content rule: H1 must be driven by one of:
- Pain point driven → names a specific problem the audience has
- Value prop driven → names a specific outcome or benefit
- Benefit / outcome → ideally with a number or tangible result
Buzzword penalty — score capped at 1/5 if H1 contains any of these without a specific qualifier:
"leading", "innovative", "scalable", "robust", "cutting-edge", "world-class", "best-in-class", "award-winning", "comprehensive", "seamless", "powerful", "next-generation", "revolutionary", "game-changing", "disruptive", "end-to-end".
Scoring:
- 1 H1, 20–70 chars, pain/value/outcome driven, no buzzwords, above fold → 5
- 1 H1, correct length, outcome present but vague → 4
- 1 H1, correct length, no clear outcome or audience signal → 3
- 1 H1 but wrong length OR contains buzzwords → 1
- Multiple H1s OR no H1 present → 0

SUBHEADLINE / MICROCOPY (3 pts)
Purpose rule: Must expand the H1, not repeat it. Introduces who this is for, how it works, or what happens next.
Length rule: 40–120 characters optimal.
Content rule — must satisfy:
- PROPERTY 1 — Adds new information. Does not restate the H1 in different words.
- PROPERTY 2 — Answers at least one of: "Who is this for?" "How does it work?" "What do I get?"
- PROPERTY 3 — Specific, not generic. Example: "We help businesses grow faster" = fails. "Pipeline management for B2B SaaS teams closing $50K+ deals" = passes.
Scoring:
- Present, 40–120 chars, adds new info, answers who/how/what, specific → 3
- Present, correct length, adds some new info but partially generic → 2
- Present but repeats H1, or wrong length → 1
- No subheadline present → 0

PRIMARY CTA ABOVE FOLD (3 pts) — Position-only check. Quality scored in CTA block.
- CTA visible above fold on both desktop (1440px) and mobile (390px) → 3
- CTA visible above fold on desktop only → 2
- CTA visible above fold on mobile only → 1
- CTA not visible above fold on either → 0

LOGOS / TRUST BADGES (2 pts)
Qualifying:
- Recognizable client company logos
- Press / media logos ("As seen in Forbes, TechCrunch")
- Certification badges with named issuing authority relevant to the offer (SOC2, ISO, GDPR)
- Award badges with named source + year
Disqualifying:
- Generic shield or lock icons with no issuing authority
- Self-issued badges ("#1 Platform" with no source)
- Partner logos of unrecognizable brands
Scoring:
- 3+ qualifying logos / badges above fold → 2
- 1–2 qualifying logos / badges above fold → 1
- No qualifying logos above fold → 0

SOCIAL RATINGS (1 pt)
Qualifying — all three required:
- Named platform (G2, Capterra, Trustpilot, Google Reviews)
- Numerical score ("4.8/5")
- Review count ("from 2,400 reviews")
Disqualifying: "Rated #1 by customers" — no platform, no number; star graphic with no count or source; self-reported rating with no third-party source.
Scoring:
- Qualifying rating present above fold → 1
- No qualifying rating above fold → 0

================================================================
FORM & LEAD FRICTION — 8 points
================================================================
Sub-dimensions: Field Count 3 | Field Type Friction 3 | Expectation Setting 1 | Trust Microcopy 1

SCENARIO HANDLING
- Form present on page → score all 4 sub-dimensions.
- No form on page → block scores 4/8 (neutral, no penalty).

FIELD COUNT (3 pts)
Funnel stage inference:
- Top of funnel → visitor is cold, exploring (homepage, generic landing page).
- Mid funnel → visitor has some intent (pricing page, feature page, demo request).
- Bottom of funnel → visitor is ready to buy or commit (checkout, trial activation, consultation booking).
Scoring:
Top of funnel: 1–2 fields → 3 | 3 fields → 2 | 4+ fields → 0
Mid funnel: 1–3 fields → 3 | 4–5 fields → 1 | 6+ fields → 0
Bottom of funnel: 1–5 fields → 3 | 6–7 fields → 1 | 8+ fields → 0

FIELD TYPE FRICTION (3 pts)
High friction field types — each present deducts:
- Phone number on top-of-funnel page
- Credit card details before free trial begins
- Company revenue / budget range
- Team size or headcount on first touch
- Free email domains blocked (Gmail, Yahoo rejected)
Low friction (acceptable any stage): Email, First name, Company name (mid/bottom only), Job title (mid/bottom only), Use case / goal (dropdown, not free text).
Scoring:
- 0 high friction → 3
- 1 high friction → 2
- 2 high friction → 1
- 3+ high friction → 0

EXPECTATION SETTING (1 pt)
Qualifying:
- CTA button copy that implies next step ("Book My 15-Min Demo", "Get Instant Access")
- Microcopy below button ("We'll send a link to your email within 2 minutes")
- Process indicator near form ("Step 1 of 2", "Takes 30 seconds")
- Timeline stated ("We'll be in touch within 1 business day")
Scoring:
- 1+ qualifying expectation signal present → 1
- No expectation signal present → 0

TRUST MICROCOPY (1 pt)
Qualifying examples:
- "No credit card required"
- "No spam, ever"
- "We don't share your data"
- "Unsubscribe anytime"
- "Cancel anytime"
- "Free forever, no commitment"
- Privacy policy link directly below form field
Disqualifying: privacy policy linked only in footer; generic "We take privacy seriously"; trust badge unrelated to the form action.
Proximity rule: Must appear within the same form container, directly below the submit button, or within 2 sibling DOM elements of the form. Footer placement does not qualify.
Scoring:
- 1+ qualifying trust microcopy in proximity → 1
- None → 0

================================================================
TRUST & SOCIAL PROOF — 18 points
================================================================
Sub-dimensions: Client Logos 4 | Testimonials 4 | Quantified Results 4 | Case Studies 3 | Trust Badges/Certs 3

CLIENT LOGOS (4 pts)
Qualifying: named, recognizable company logos; press / media logos.
Disqualifying: generic icons with no brand recognition; logos with no alt text / company name; partner logos of unrecognizable brands.
Scoring:
- 6+ recognizable logos → 4
- 3–5 → 3
- 1–2 → 2
- Logos present but unrecognizable / unverifiable → 1
- None → 0

TESTIMONIALS (4 pts)
Qualifying — must have all three:
- Full name
- Title and / or company
- Specific claim — names an outcome, result, or experience. Not just "Great product!"
Disqualifying: initials-only attribution; anonymous; generic praise with no outcome; internal / employee testimonials.
Scoring:
- 3+ qualifying → 4
- 2 qualifying → 3
- 1 qualifying → 2
- Testimonials present but fail attribution or specificity → 1
- None → 0

QUANTIFIED RESULTS (4 pts)
Qualifying:
- Percentage improvement ("Reduced CAC by 35%")
- Revenue or pipeline impact ("$2M in pipeline generated in 90 days")
- Time savings ("Cut reporting time from 4 hours to 20 minutes")
- Scale indicators ("10,000+ companies", "500M+ events tracked")
Disqualifying: vague claims; numbers without context.
Specificity rule: Precise numbers (10,427 / 94%) score higher than round numbers — precision signals real measurement.
Scoring:
- 2+ quantified results, specific and in context, at least one precise number → 4
- 2+ quantified results, round numbers or missing context → 3
- 1 quantified result, specific and in context → 2
- Quantified claims present but vague / no context → 1
- None → 0

CASE STUDIES (3 pts)
Qualifying minimum: named client + context/problem + outcome (with or without number) + link to full case study.
Scoring:
- 2+ case studies, named client + outcome with specific number ("210% increase in SQLs for Acme Corp") → 3
- 2+ case studies, named client + outcome without number → 2
- 1 case study, named client + outcome → 1
- Case studies present but fail naming or outcome → 0

TRUST BADGES / CERTIFICATIONS (3 pts)
Qualifying:
- Security certifications with named authority (SOC2, ISO 27001, GDPR)
- Industry awards with named issuer + year ("G2 Leader, Winter 2025")
- Platform rating badges from named review sites
- Regulatory / compliance badges relevant to industry (HIPAA, PCI-DSS)
Disqualifying: generic padlock / shield icons; "#1 Platform" with no source; "Award-winning" with no named award; badges older than 3 years.
Scoring:
- 2+ qualifying, named source, relevant → 3
- 1 qualifying → 2
- Badges present but missing source / relevance → 1
- None → 0

================================================================
COPY QUALITY & READABILITY — 15 points
================================================================
Sub-dimensions: Flesch Reading Ease 6 | FK Grade Level 5 | Difficult Word Density 2 | Word Count Range 2

COMPUTATION METHOD — All four sub-dimensions are deterministic. No AI judgment.
Extract from raw HTML: H1/H2/H3, body copy, bullets, CTA button text, form labels and microcopy. Exclude navigation, footer boilerplate, cookie notices, meta tags.

Formulas:
- Flesch Reading Ease = 206.835 − 1.015 × (words/sentences) − 84.6 × (syllables/words)
- FK Grade Level = 0.39 × (words/sentences) + 11.8 × (syllables/words) − 15.59
- Difficult Word Density = (words with 3+ syllables / total words) × 100
- Word Count = total words in extracted copy

FLESCH READING EASE (6 pts)
Industry targets:
- SaaS / Ecommerce / Education → 70–90
- Legal / Financial Services → 50–70
Scoring (SaaS / Ecommerce / Education): 70–90 → 6 | 60–70 → 5 | 50–60 → 4 | 30–50 → 2 | 0–30 → 1
Scoring (Legal / Financial Services): 50–70 → 6 | 70–90 → 5 | 30–50 → 3 | 0–30 → 1

FK GRADE LEVEL (5 pts)
Industry targets:
- SaaS / Ecommerce / Education → Grade 5–7
- Legal / Financial Services → Grade 8–10
Scoring (SaaS / Ecommerce / Education): Grade 5–7 → 5 | 8–9 → 4 | 10–11 → 3 | 12+ → 1
Scoring (Legal / Financial Services): Grade 8–10 → 5 | 7 and below → 4 | 11–12 → 3 | 13+ → 1

DIFFICULT WORD DENSITY (2 pts)
Target: under 15% of total word count.
- Under 15% → 2
- 15–25% → 1
- Over 25% → 0

WORD COUNT RANGE (2 pts)
Sourced targets: SaaS 250–725 words. Professional / B2B 275–745 words.
For Legal, Financial, Ecommerce, Education — no primary source data exists. Score neutral 1/2 by default until data is sourced.
Scoring:
- Within ideal range for industry → 2
- Up to 20% outside → 1
- More than 20% outside → 0
- Industries without sourced data → 1

================================================================
VALUE PROPOSITION & MESSAGING — 24 points
================================================================
Sub-dimensions: Appeal 6 | Exclusivity 6 | Clarity 6 | Credibility 6
Central question: "If I am your ideal prospect, why should I buy from you rather than any of your competitors?"

APPEAL (6 pts)
Measures whether the page copy addresses what the customer desires (outcome, pain, goal) rather than what the company wants to say about itself.
Customer desire signals — rewarded:
- Names a specific outcome the customer achieves
- Names a specific pain point being eliminated
- Uses customer language — the words a customer would use to describe their own problem
- Outcome is tangible — time saved, money made, risk reduced, goal achieved
Company-centric signals — penalized:
- Describes what the company does, not what the customer gets ("We are a full-service AI marketing agency")
- Describes product features without connecting to customer outcome ("Our platform uses machine learning to process data at scale")
- Uses "we" or "our" in H1 without a customer benefit attached
- Desire is implied but never stated
Scoring:
- H1 + subhead both outcome/pain driven, customer language, tangible result → 6
- H1 outcome driven, subhead partially generic or company-centric → 5
- H1 has benefit signal but vague, subhead adds some customer context → 4
- H1 describes product/company, subhead partially redeems with customer benefit → 3
- Both H1 and subhead company-centric, feature-focused, or "we/our" without customer benefit → 2
- No customer desire addressed anywhere above the fold → 0

EXCLUSIVITY (6 pts)
Measures whether the offer is differentiated — whether it could only be claimed by this company, or whether a competitor could copy it word for word without lying.
Buzzword auto-penalty — score capped at 2/6 if H1 or subhead contains any of these without a specific verifiable qualifier:
"leading", "innovative", "scalable", "robust", "cutting-edge", "world-class", "best-in-class", "award-winning", "comprehensive", "seamless", "powerful", "next-generation", "revolutionary", "game-changing", "disruptive", "end-to-end", "holistic", "transformative", "future-proof".
Exclusivity signals — rewarded:
- Proprietary mechanism named ("The only platform that auto-qualifies leads before they hit your CRM")
- Specific niche or ICP defined ("For B2B SaaS companies between $1M–$10M ARR")
- Unique methodology or process named ("Using our 4-step pipeline audit")
- Specific data, integration, or capability exclusive to this company
- Quantified differentiator ("3x faster than manual outreach")
Generic signals — penalized:
- Category description any competitor could claim ("AI-powered marketing platform")
- Generic superlative with no proof ("The best CRM for sales teams")
- Broad ICP that fits everyone ("For businesses that want to grow")
- No differentiation stated anywhere in H1 or subhead
Scoring:
- Proprietary mechanism or specific niche, quantified differentiator stated → 6
- Clear differentiator stated, specific ICP, no buzzwords — but not fully proprietary → 5
- Some differentiation present but partially generic — competitor could adapt it easily → 4
- Differentiation implied but not stated → 3
- Buzzword present (auto-cap) OR fully generic → 2 max
- No differentiation whatsoever → 0

CLARITY (6 pts)
Measures whether a first-time visitor immediately understands what the company offers, who it is for, and what happens if they convert — without scrolling, searching, or inferring.
Structure rule — MECLABS clarity sequence: H1 (what) → Subhead (who + how) → Bullets (proof/benefit). Each layer must add new information. Repetition between layers = clarity failure.
5-second test — visitor must answer all three from H1 + subhead:
1. What does this company offer?
2. Who is it for?
3. What do I get if I convert?
Clarity signals — rewarded:
- What is stated in H1 without jargon
- Who is explicitly named in H1 or subhead
- What happens next is implied or stated near the CTA
- One idea per sentence
- No industry jargon a non-expert couldn't understand
Clarity failures — penalized:
- Visitor cannot determine what the product does from H1 alone
- Who this is for is never stated
- H1 and subhead say the same thing in different words
- Jargon-heavy copy that requires domain expertise to parse
- Multiple claims competing in H1
Scoring:
- What + who + outcome clear from H1 + subhead, no jargon, logical structure → 6
- What + outcome clear, who implied but not stated explicitly → 5
- What is clear, who and outcome require reading further down page → 4
- What partially clear but jargon-heavy or requires inference → 3
- Cannot determine product or audience from above-fold copy → 2
- No discernible offer or audience signal → 0

CREDIBILITY (6 pts)
Measures whether there is verifiable evidence supporting the VP claim in or near the hero section. Without proof, even the strongest claim is just an assertion.
Three credibility dimensions (MECLABS):
- SPECIFICITY — The claim must be specific enough to be falsifiable.
- PROXIMITY — The credibility evidence must appear near the claim it supports.
- INTENSITY — The strength of the evidence must match the strength of the claim.
Qualifying signals:
- Specific metric with context near hero
- Named recognizable client in proximity to the VP claim
- Third-party verification — named award, named review platform + score
- Precise numbers (10,427 not "10,000+")
- Named methodology or process that explains how the claim is achieved
Disqualifying:
- Unsubstantiated superlative ("The most powerful platform available")
- Round numbers without context
- Generic social proof with no specifics
- Credibility signals present but placed far from the VP claim
- Strong claims entirely unsupported anywhere on the page
Scoring:
- Specific metric + named client or third-party verification in proximity to VP claim → 6
- Specific metric present near VP but no named source or third-party proof → 5
- Named client or award present near VP but no quantified outcome attached → 4
- Credibility signal present on page but not in proximity to the VP claim → 3
- Generic social proof only → 2
- No credibility signal anywhere on page → 0

================================================================
TOTAL SCORE
================================================================
VP & Messaging (24) + CTA (21) + Trust & Social Proof (18) + Copy & Readability (15) + Above the Fold (14) + Form Friction (8) = 100 pts

When you score, return the OVERALL score on a 0–100 scale by summing the module scores above. Use rule_id values that map to the sub-dimension (e.g. "vp.appeal", "cta.copy_quality", "atf.h1", "form.field_count").
`;
