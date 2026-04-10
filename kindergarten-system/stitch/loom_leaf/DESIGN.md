# Design System Strategy: The Nurturing Atelier

## 1. Overview & Creative North Star
**The Creative North Star: "Precision Softness"**

Traditional enterprise systems for education often feel cold, clinical, or overly "playful" to the point of appearing unprofessional. This design system rejects that binary. We are building a "Digital Atelier"—a space that feels like a high-end architectural studio for child development. 

The system moves beyond the "standard dashboard" by utilizing **intentional asymmetry** and **tonal depth**. We break the rigid grid by allowing editorial-style typography to breathe and by overlapping UI elements to create a sense of physical space. The goal is to provide parents and teachers with a sense of "Curated Calm," where complex health and quality data feel effortless to digest.

---

## 2. Colors: Chromatic Weight & Tonal Depth
This system uses a palette that balances authority with vitality. 

*   **Primary (`#004e63`):** The "Trust Anchor." Used for navigation and primary actions to establish an enterprise-grade feel.
*   **Secondary (`#186d2d`):** The "Growth Engine." Reserved for health metrics, positive progress, and well-being indicators.
*   **Tertiary (`#703800`):** The "Warmth Accent." Used sparingly to draw the eye to critical alerts or human-centric touchpoints (e.g., parent messages).

### The "No-Line" Rule
Standard UI relies on 1px borders to separate content. **In this system, 1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through:
1.  **Background Shifting:** A card using `surface_container_lowest` sitting on a `surface_container_low` background.
2.  **Negative Space:** Using the Spacing Scale to create "gutters of light" between content blocks.

### Surface Hierarchy & Nesting
Treat the interface as a series of stacked, fine-paper sheets. 
*   **Base Layer:** `surface` or `background` (#f9f9f8).
*   **Interactive Zones:** `surface_container` or `surface_container_low`.
*   **Elevated Content (Cards):** `surface_container_lowest` (#ffffff).
By nesting these tones, we create a sophisticated "recessed" or "protruding" look that guides the user’s focus without the clutter of lines.

### Signature Textures
Main CTAs and high-level health summaries should utilize subtle linear gradients transitioning from `primary_container` to `primary`. This adds a "visual soul" and a sense of depth that flat color cannot provide.

---

## 3. Typography: The Editorial Voice
We utilize two distinct typefaces to create a high-end hierarchy.

*   **The Editorial Voice (Manrope):** Used for `display` and `headline` scales. Its geometric but soft curves feel modern and approachable. Large `display-lg` numbers should be used for key quality scores (e.g., a "98%" health rating), treating the data as a headline.
*   **The Utility Voice (Inter):** Used for `title`, `body`, and `label` scales. Inter provides the technical clarity required for reading health reports and management logs.

**Hierarchy Strategy:** 
Use extreme scale contrast. Pair a bold `headline-lg` (Manrope) with a muted `body-sm` (Inter) in `on_surface_variant` to create an "Editorial Dashboard" look.

---

## 4. Elevation & Depth: Tonal Layering
Depth is a functional tool, not a decoration.

### The Layering Principle
Instead of shadows, use **Tonal Layering**. Place a high-priority component in `surface_container_lowest` (pure white) inside a `surface_container_high` wrapper. This creates a "natural lift" that mimics how light hits physical objects.

### Ambient Shadows
Where floating elements (like Modals or Floating Action Buttons) are required, use **Ambient Shadows**:
*   **Blur:** 40px - 60px.
*   **Opacity:** 4% - 8%.
*   **Color:** Tint the shadow with `primary` rather than pure black. This prevents the "muddy" look and keeps the UI feeling clean and airy.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**. This is a 1px stroke using the `outline_variant` token at **10-15% opacity**. It should be felt, not seen.

### Glassmorphism
For navigation overlays or top bars, use `surface` with a 70% opacity and a `backdrop-filter: blur(20px)`. This allows the soft greens and blues of the content to bleed through, making the application feel integrated and high-end.

---

## 5. Components

### Buttons
*   **Primary:** Roundedness `full`. Gradient from `primary` to `primary_container`. White text.
*   **Secondary:** Roundedness `md`. Surface `surface_container_high` with `on_surface` text. No border.
*   **Tertiary:** No background. Bold `label-md` in `primary` color.

### Cards & Data Visualization
*   **Rule:** Forbid divider lines within cards.
*   **Layout:** Use `surface_container_lowest`. Separate the "Header" from the "Body" of a card using a 24px padding gap and a subtle background shift to `surface_container_low` for the footer area.
*   **Charts:** Use `secondary` (green) for health trends and `tertiary_fixed` (warm orange) for areas requiring attention. Ensure chart axes use `outline_variant` at 20% opacity.

### Input Fields
*   **Style:** Subtle `surface_container_high` background. No border.
*   **Focus State:** A "Ghost Border" of `primary` at 40% opacity and a 4px soft glow.
*   **Roundedness:** `sm` (0.25rem) to maintain a professional, slightly sharper edge for data entry.

### The "Daily Pulse" Component (Unique)
A custom horizontal scroll component for kindergarten teachers to quickly log health checks. It should use `surface_container_lowest` chips with `xl` (1.5rem) roundedness, feeling soft and "touch-friendly" like a smooth pebble.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 80px left, 40px right) on top-level pages to create an editorial feel.
*   **Do** use `surface_tint` at 5% opacity over large white areas to prevent "monitor glare" and keep the experience "calm."
*   **Do** prioritize white space over information density. If a page feels "busy," increase the vertical spacing between sections using the `xl` scale.

### Don’t:
*   **Don't** use 100% black text. Always use `on_surface` (#1a1c1b) for better readability and a premium feel.
*   **Don't** use "Drop Shadows" with a 0px blur. All shadows must be diffused.
*   **Don't** use default browser scrollbars. Style them to be thin, `outline_variant` colored tracks with `primary_fixed_dim` handles.