## Purpose

This capability gives marketing users controlled, scheduled homepage content placements without replacing Shopify's commerce data or the storefront's default experience.

## ADDED Requirements

### Requirement: Homepage content slots

The storefront SHALL expose the `home-hero` and `home-promo` placements on the homepage for BILDIT-managed content.

#### Scenario: Scheduled hero content is assigned

- **WHEN** BILDIT returns active published content for the homepage and the `home-hero` placement
- **THEN** the storefront renders that content in the hero placement

#### Scenario: Scheduled promotional content is assigned

- **WHEN** BILDIT returns active published content for the homepage and the `home-promo` placement
- **THEN** the storefront renders that content in the promotional placement

### Requirement: Default homepage fallbacks

Each homepage placement SHALL retain a usable Singhar by Sidra fallback when no applicable BILDIT content is available.

#### Scenario: No content is scheduled

- **WHEN** a homepage placement has no applicable BILDIT content
- **THEN** the existing storefront hero or promotional experience remains visible

#### Scenario: BILDIT content is unavailable

- **WHEN** the BILDIT request fails, times out, or returns an invalid response
- **THEN** the homepage renders its fallback experience and remains usable

### Requirement: Location and schedule matching

The storefront SHALL request and display homepage content for the `/` location only when that content is active and published for the current request time, while preserving BILDIT preview-date behavior for Visual Editor sessions.

#### Scenario: Content location does not match

- **WHEN** published BILDIT content is assigned to a location other than `/`
- **THEN** that content is not rendered in the homepage placements

#### Scenario: Future content is previewed

- **WHEN** a Visual Editor request supplies a supported preview date for a future schedule
- **THEN** the homepage renders the content applicable to that preview date instead of only the current schedule

### Requirement: Visual Editor support

The storefront SHALL allow the BILDIT Visual Editor to load the homepage in its supported iframe context and update the homepage placements without requiring a separate manual CMS script in the document head.

#### Scenario: Visual Editor opens the homepage

- **WHEN** the homepage is opened from the BILDIT Visual Editor
- **THEN** the storefront establishes the editor bridge and exposes the homepage placements for editing

#### Scenario: Normal visitor opens the homepage

- **WHEN** a visitor opens the homepage outside the Visual Editor
- **THEN** the storefront renders normally without exposing editor controls or requiring editor interaction

### Requirement: Credential and commerce boundaries

The storefront SHALL keep BILDIT credentials server-side and SHALL preserve Shopify as the source of truth for catalog, cart, checkout, customer account, analytics, and SEO behavior.

#### Scenario: Homepage data is requested

- **WHEN** the server loads BILDIT content
- **THEN** the API key is read from server runtime configuration and is not included in browser markup, loader data, or client-side requests

#### Scenario: Shopper uses commerce functionality

- **WHEN** a shopper browses products, adds an item to the cart, signs in, or proceeds to checkout
- **THEN** the existing Shopify-backed behavior remains unchanged by the BILDIT homepage integration
