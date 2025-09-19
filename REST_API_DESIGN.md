
# InventoryPro REST API Design (v1)

**Key Phrase:** Inventory management REST API for African retail businesses  
**Meta Description:** A complete, professional REST API specification for InventoryPro, covering resources, relationships, endpoints, error handling, and advanced inventory operations such as stock transfers and low‑stock alerts.  
**Tags:** REST API, inventory management, products, suppliers, categories, stores, stock, purchase orders, sales orders, pagination, error handling



## Executive Summary

InventoryPro is an inventory management platform designed for African retail businesses operating across multiple store locations. This document defines the complete REST API design for version 1 (v1). It focuses on clear resource boundaries, predictable URI patterns, consistent error handling, and pragmatic features needed by retail operations: stock tracking per store, purchasing, sales, transfers, and low‑stock monitoring. The API is resource‑oriented, stateless, and designed for ease of use by both web and mobile clients. No implementation details are included—this is a specification meant to guide development teams.


## Business Domain Analysis

### Primary Business Entities
- **Category**: Groups products for browsing, reporting, and merchandising.
- **Product**: Sellable items with SKU, pricing, tax, and packaging details.
- **Supplier**: Entities that provide products; used for purchasing and reordering.
- **Store**: Physical or virtual locations that hold stock and conduct sales.
- **InventoryItem**: Per‑store stock ledger for a product, including on‑hand quantity and reorder thresholds.
- **PurchaseOrder**: Inbound replenishment from suppliers (with line items).
- **SalesOrder**: Outbound customer sales (with line items).
  

### Key Relationships
- **Category 1—* Product**: A product belongs to one category; a category has many products.
- **Supplier 1—* Product**: A product is primarily supplied by one supplier (configurable).
- **Store *—* Product** via **InventoryItem**: Inventory is tracked per store per product.
- **PurchaseOrder 1—* PurchaseOrderItem** to **Product**: Each PO has many line items referencing products.
- **SalesOrder 1—* SalesOrderItem** to **Product**: Each sale has many line items referencing products.

### Critical Business Operations
- Manage product catalog (create, update, retire).
- Track stock per store; adjust stock on receipts, sales, returns, and transfers.
- Purchase from suppliers (create/approve/receive POs).
- Sell products and decrement stock (Sales Orders).
- Monitor low‑stock items and generate reorder suggestions.
- Transfer stock between stores.
- Search/filter by name, SKU, category, supplier, and status.

### Data Attributes (High Level)
- Category: id, name, description, status, created_at, updated_at.
- Product: id, sku, name, description, category_id, supplier_id, price, cost, tax_rate, unit, barcode, status, created_at, updated_at.
- Supplier: id, name, contact info, lead_time_days, payment_terms, status, created_at, updated_at.
- Store: id, name, code, address, phone, timezone, status, created_at, updated_at.
- InventoryItem: id, product_id, store_id, on_hand, reserved, reorder_level, reorder_qty, last_counted_at, updated_at.
- PurchaseOrder: id, supplier_id, store_id, status, expected_date, approved_at, received_at, created_at, updated_at.
- PurchaseOrderItem: id, purchase_order_id, product_id, qty_ordered, qty_received, unit_cost, tax_rate.
- SalesOrder: id, store_id, status, customer_ref, sold_at, created_at, updated_at.
- SalesOrderItem: id, sales_order_id, product_id, qty, unit_price, discount, tax_rate.


## Resource Specifications

> Data types use common JSON types: `string`, `number`, `integer`, `boolean`, `datetime (ISO 8601)`, `uuid`.

### 1) Category
**Purpose:** Organize products for browsing, pricing, and analytics.  
**Attributes:**
- `id: uuid`
- `name: string` (unique per tenant)
- `description: string` (optional)
- `status: string` (enum: `active`, `archived`)
- `created_at: datetime` (server)
- `updated_at: datetime` (server)

**Relationships:** `Category 1—* Product`  
**Business Rules & Constraints:**
- `name` required, unique.
- Categories with products cannot be deleted; allow `archived` status instead.

### 2) Product
**Purpose:** Core sellable item with pricing and categorization.  
**Attributes:**
- `id: uuid`
- `sku: string` (unique)
- `name: string`
- `description: string` (optional)
- `category_id: uuid` (FK Category)
- `supplier_id: uuid` (FK Supplier, optional but recommended)
- `price: number` (selling price)
- `cost: number` (avg or standard cost)
- `tax_rate: number` (percentage; 0–1 or 0–100 as defined by tenant, see rationale)
- `unit: string` (e.g., piece, pack, kg)
- `barcode: string` (optional, unique if present)
- `status: string` (enum: `active`, `discontinued`)
- `created_at: datetime`
- `updated_at: datetime`

**Relationships:** `Product *—1 Category`, `Product *—1 Supplier`, `Product *—* Store` via InventoryItem.  
**Business Rules & Constraints:**
- `sku` unique and required.
- `price >= 0`, `cost >= 0`.
- Products with stock or historical orders cannot be hard‑deleted; use `discontinued`.

### 3) Supplier
**Purpose:** Source of products for replenishment.  
**Attributes:**
- `id: uuid`
- `name: string` (unique)
- `email: string` (optional)
- `phone: string` (optional)
- `address: string` (optional)
- `lead_time_days: integer` (default 7)
- `payment_terms: string` (e.g., Net 30)
- `status: string` (enum: `active`, `inactive`)
- `created_at: datetime`
- `updated_at: datetime`

**Relationships:** `Supplier 1—* Product`, `Supplier 1—* PurchaseOrder`.  
**Business Rules & Constraints:**
- Cannot be deleted if referenced by products or POs; set `inactive`.

### 4) Store
**Purpose:** Location where inventory is held and transactions occur.  
**Attributes:**
- `id: uuid`
- `name: string`
- `code: string` (unique short code)
- `address: string`
- `phone: string` (optional)
- `timezone: string` (IANA TZ)
- `status: string` (enum: `open`, `closed`, `archived`)
- `created_at: datetime`
- `updated_at: datetime`

**Relationships:** `Store *—* Product` via InventoryItem, `Store 1—* SalesOrder`, `Store 1—* PurchaseOrder`.  
**Business Rules & Constraints:**
- `code` unique and immutable after creation.

### 5) InventoryItem
**Purpose:** Track per‑store product stock and replenishment thresholds.  
**Attributes:**
- `id: uuid`
- `product_id: uuid` (FK)
- `store_id: uuid` (FK)
- `on_hand: integer` (>= 0)
- `reserved: integer` (>= 0)
- `reorder_level: integer` (>= 0)
- `reorder_qty: integer` (>= 0)
- `last_counted_at: datetime` (optional)
- `updated_at: datetime`

**Relationships:** `InventoryItem *—1 Product`, `InventoryItem *—1 Store`.  
**Business Rules & Constraints:**
- Unique composite `(product_id, store_id)`.
- Server enforces non‑negative stock; adjustments go through domain endpoints.

### 6) PurchaseOrder & PurchaseOrderItem
**Purpose:** Inbound replenishment workflow.  
**PurchaseOrder Attributes:**
- `id: uuid`
- `supplier_id: uuid` (FK)
- `store_id: uuid` (FK destination)
- `status: string` (enum: `draft`, `approved`, `partially_received`, `received`, `cancelled`)
- `expected_date: date` (optional)
- `approved_at: datetime` (server)
- `received_at: datetime` (server)
- `created_at: datetime`
- `updated_at: datetime`

**PurchaseOrderItem Attributes:**
- `id: uuid`
- `purchase_order_id: uuid` (FK)
- `product_id: uuid` (FK)
- `qty_ordered: integer` (> 0)
- `qty_received: integer` (>= 0)
- `unit_cost: number` (>= 0)
- `tax_rate: number` (>= 0)

**Business Rules & Constraints:**
- Items required before approval.
- Receiving updates `InventoryItem.on_hand` atomically.

### 7) SalesOrder & SalesOrderItem
**Purpose:** Outbound sales with stock decrement.  
**SalesOrder Attributes:**
- `id: uuid`
- `store_id: uuid` (FK)
- `status: string` (enum: `draft`, `confirmed`, `fulfilled`, `cancelled`)
- `customer_ref: string` (optional)
- `sold_at: datetime` (server on confirm)
- `created_at: datetime`
- `updated_at: datetime`

**SalesOrderItem Attributes:**
- `id: uuid`
- `sales_order_id: uuid` (FK)
- `product_id: uuid` (FK)
- `qty: integer` (> 0)
- `unit_price: number` (>= 0)
- `discount: number` (>= 0, optional)
- `tax_rate: number` (>= 0)

**Business Rules & Constraints:**
- Confirmation decrements `InventoryItem.on_hand` per store with consistency checks.



## Endpoint Documentation

**Conventions**
- Base URL: `/api/v1`
- Resource names: plural nouns.
- IDs: UUIDs.
- Pagination: `?page=1&limit=50` (default `page=1`, `limit=25`, max `100`).
- Sorting: `?sort=field,-otherField`.
- Filtering: `?field=value` or comparison operators `?field[gt]=10`.
- Responses use UTC ISO 8601 datetimes.
- Errors follow a standard schema (see “Error Handling”).

### Common Response Envelopes
- **List**: `{ "data": [...], "page": 1, "limit": 25, "total": 123 }`
- **Single**: `{ "data": { ... } }`

### Status Codes
- Success: `200 OK`, `201 Created`, `202 Accepted`, `204 No Content`
- Client errors: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`
- Server errors: `500 Internal Server Error`, `503 Service Unavailable`

### A) Category Endpoints

| Resource | Operation | HTTP | URI | Request Body | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| Category | List categories | GET | `/categories` | — | `200` with list + pagination | `400` invalid params |
| Category | Create category | POST | `/categories` | `{ "name": "...", "description": "...", "status": "active" }` | `201` with category | `409` name exists, `422` validation |
| Category | Get category | GET | `/categories/{id}` | — | `200` with category | `404` not found |
| Category | Update category | PATCH | `/categories/{id}` | Partial fields | `200` with updated category | `409` name exists, `422` validation |
| Category | Archive category | DELETE | `/categories/{id}` | — | `204` no content (soft delete) | `404` not found, `409` has products |

**Filtering & Pagination**: `GET /categories?status=active&name=beverages&page=1&limit=50`

### B) Product Endpoints

| Resource | Operation | HTTP | URI | Request Body | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| Product | List products | GET | `/products` | — | `200` with list | `400` invalid params |
| Product | Create product | POST | `/products` | `{ "sku": "...", "name": "...", "category_id": "...", "supplier_id": "...", "price": 12.50, "cost": 8.10, "tax_rate": 0.15, "unit": "piece", "barcode": "..." }` | `201` with product | `409` SKU exists, `422` validation |
| Product | Get product | GET | `/products/{id}` | — | `200` with product | `404` not found |
| Product | Update product | PATCH | `/products/{id}` | Partial fields | `200` with updated product | `409` conflicts, `422` validation |
| Product | Discontinue product | DELETE | `/products/{id}` | — | `204` (mark as discontinued) | `404` not found, `409` has stock/history |

**Filtering & Search**:  
`GET /products?category_id=...&supplier_id=...&status=active&sku=ABC123&name=rice`  
`GET /products/search?query=long%20grain%20rice&limit=10`

### C) Supplier Endpoints

| Resource | Operation | HTTP | URI | Request Body | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| Supplier | List suppliers | GET | `/suppliers` | — | `200` list | `400` invalid params |
| Supplier | Create supplier | POST | `/suppliers` | `{ "name": "...", "email": "...", "phone": "...", "address": "...", "lead_time_days": 7, "payment_terms": "Net 30" }` | `201` with supplier | `409` name exists, `422` validation |
| Supplier | Get supplier | GET | `/suppliers/{id}` | — | `200` | `404` not found |
| Supplier | Update supplier | PATCH | `/suppliers/{id}` | Partial fields | `200` | `422` validation |
| Supplier | Deactivate supplier | DELETE | `/suppliers/{id}` | — | `204` (set status=inactive) | `404`, `409` in use |

### D) Store Endpoints

| Resource | Operation | HTTP | URI | Request Body | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| Store | List stores | GET | `/stores` | — | `200` list | `400` invalid params |
| Store | Create store | POST | `/stores` | `{ "name": "...", "code": "ACC01", "address": "...", "phone": "...", "timezone": "Africa/Accra" }` | `201` with store | `409` code exists, `422` validation |
| Store | Get store | GET | `/stores/{id}` | — | `200` | `404` |
| Store | Update store | PATCH | `/stores/{id}` | Partial fields (code immutable) | `200` | `409` code conflict, `422` validation |
| Store | Archive store | DELETE | `/stores/{id}` | — | `204` | `404`, `409` has inventory/history |

### E) InventoryItem Endpoints

| Resource | Operation | HTTP | URI | Request Body | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| Inventory | List inventory | GET | `/inventory` | — | `200` list (includes product & store refs) | `400` |
| Inventory | Get item | GET | `/inventory/{id}` | — | `200` | `404` |
| Inventory | Create item | POST | `/inventory` | `{ "product_id":"...", "store_id":"...", "on_hand":0, "reorder_level":10, "reorder_qty":20 }` | `201` with item | `409` duplicate composite, `422` |
| Inventory | Update thresholds | PATCH | `/inventory/{id}` | `{ "reorder_level": 15, "reorder_qty": 30 }` | `200` | `422` |
| Inventory | Adjust stock (domain op) | POST | `/inventory/{id}/adjust` | `{ "reason":"cycle_count", "delta": -2, "note":"damaged" }` | `200` with updated item | `409` negative stock, `422` |

**Filtering**: `GET /inventory?store_id=...&product_id=...&low_stock=true`

### F) PurchaseOrder Endpoints

| Resource | Operation | HTTP | URI | Request Body | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| PurchaseOrder | List POs | GET | `/purchase-orders` | — | `200` list | `400` |
| PurchaseOrder | Create PO (draft) | POST | `/purchase-orders` | `{ "supplier_id":"...", "store_id":"...", "expected_date":"2025-09-10", "items":[ { "product_id":"...", "qty_ordered":10, "unit_cost":7.50, "tax_rate":0.15 } ] }` | `201` with PO | `422` |
| PurchaseOrder | Get PO | GET | `/purchase-orders/{id}` | — | `200` | `404` |
| PurchaseOrder | Update PO | PATCH | `/purchase-orders/{id}` | Modify header or items (while `draft`) | `200` | `409` if not draft |
| PurchaseOrder | Approve PO | POST | `/purchase-orders/{id}/approve` | — | `200` with status `approved` | `409` invalid state |
| PurchaseOrder | Receive PO (partial/full) | POST | `/purchase-orders/{id}/receive` | `{ "items":[ { "item_id":"...", "qty_received":5 } ] }` | `200` updates inventory & status | `409` over‑receipt, `422` |
| PurchaseOrder | Cancel PO | POST | `/purchase-orders/{id}/cancel` | `{ "reason": "supplier_delay" }` | `200` status `cancelled` | `409` invalid state |

### G) SalesOrder Endpoints

| Resource | Operation | HTTP | URI | Request Body | Success Response | Error Responses |
|---|---|---|---|---|---|---|
| SalesOrder | List SOs | GET | `/sales-orders` | — | `200` list | `400` |
| SalesOrder | Create SO (draft) | POST | `/sales-orders` | `{ "store_id":"...", "customer_ref":"...", "items":[ { "product_id":"...", "qty":2, "unit_price":12.50, "discount":0, "tax_rate":0.15 } ] }` | `201` with SO | `422` |
| SalesOrder | Get SO | GET | `/sales-orders/{id}` | — | `200` | `404` |
| SalesOrder | Update SO | PATCH | `/sales-orders/{id}` | Modify header or items (while `draft`) | `200` | `409` if not draft |
| SalesOrder | Confirm SO | POST | `/sales-orders/{id}/confirm` | — | `200` status `confirmed`, `sold_at` set, inventory decremented | `409` insufficient stock |
| SalesOrder | Cancel SO | POST | `/sales-orders/{id}/cancel` | `{ "reason":"customer_request" }` | `200` status `cancelled` | `409` invalid state |


## Advanced Features

### Association Endpoints
- **Products by Category**: `GET /categories/{id}/products?status=active`
- **Products by Supplier**: `GET /suppliers/{id}/products`
- **Inventory by Store**: `GET /stores/{id}/inventory?low_stock=true`
- **Suppliers for Product** (alternate suppliers): `GET /products/{id}/suppliers` (optional extension)

### Bulk Operations
- **Bulk Create/Update Products**: `POST /products:batch` with `{ "upsert": true, "items": [ ... ] }` → `202 Accepted` with job id.
- **Bulk Inventory Adjustments**: `POST /inventory:batch-adjust` with list of `{ inventory_id, delta, reason }` → atomic per item, partial failures reported.
- **Bulk Price Updates**: `POST /products:bulk-price` with `{ "filter": {...}, "price_delta": 0.05, "mode": "percent_increase" }`.

### Search & Filtering
- **Full‑text product search**: `GET /products/search?query=rice%205kg&limit=20`
- **Low‑stock alert feed**: `GET /alerts/low-stock?store_id=...` returns products below `reorder_level`.
- **Reorder suggestions**: `GET /replenishment/suggestions?store_id=...` returns recommended POs based on `reorder_qty` and `lead_time_days`.

### Domain‑Specific Operations
- **Stock Transfer between Stores**  
  - Create transfer: `POST /stock-transfers` with `{ "from_store_id":"...", "to_store_id":"...", "items":[{"product_id":"...","qty":5}] }` → `201 transfer` (statuses: `draft`, `in_transit`, `completed`, `cancelled`)
  - Ship transfer: `POST /stock-transfers/{id}/ship`
  - Receive transfer: `POST /stock-transfers/{id}/receive`
- **Cycle Count & Reconciliation**  
  - Start count: `POST /inventory/{id}/count` → creates a count session
  - Reconcile: `POST /inventory/{id}/reconcile` with `{ "counted": 97 }`


## Error Handling

**Standard Error Schema**
```json
{
  "error": {
    "code": "string_machine_readable",
    "message": "Human readable summary",
    "details": { "field": ["issue", "hint"] },
    "correlation_id": "uuid"
  }
}


**Examples**
- `400 Bad Request`: `code="invalid_query"`
- `401 Unauthorized`: `code="auth_required"`
- `403 Forbidden`: `code="insufficient_permissions"`
- `404 Not Found`: `code="resource_not_found"`
- `409 Conflict`: `code="state_conflict"` or `code="duplicate_key"`
- `422 Unprocessable Entity`: `code="validation_error"`

**Consistency Rules**
- Always include `correlation_id` for traceability.
- Validation errors MUST populate `details` with per‑field messages.
- 409 for state transitions that violate workflow constraints.


## Design Rationale

- **Resource Modeling:** The chosen seven resources map directly to core retail processes (catalog, purchasing, sales, stock). `InventoryItem` isolates per‑store stock to avoid ambiguity and enables accurate low‑stock detection.
- **Versioning:** URL versioning (`/api/v1`) keeps breaking changes explicit and client‑friendly.
- **Naming & URIs:** Plural nouns, hierarchical association endpoints, and clear domain actions (e.g., `/approve`, `/receive`) for workflow steps that are not pure CRUD.
- **HTTP Methods:** `GET`, `POST`, `PATCH`, and `DELETE` used in line with REST norms. Domain transitions use `POST` to subresources/actions.
- **Pagination & Filtering:** Standard query params with server‑enforced limits protect performance and prevent over‑fetching on mobile networks.
- **Idempotency:** `PUT` is avoided in favor of `PATCH`; idempotency keys (e.g., `Idempotency-Key` header) are recommended for payment‑like or adjustment endpoints.
- **Validation & Constraints:** Prevent negative stock; block deletion of referenced entities; use soft‑delete semantics for auditability.
- **Observability:** `correlation_id` in errors; recommend `X-Request-Id` on requests and structured logs.
- **Localization:** `Store.timezone` and ISO timestamps enable correct local display for multi‑country operations.
- **Security (Out of Scope for Spec, design notes):** JWT/OAuth 2.0 suggested; RBAC with per‑store permissions; rate limiting and audit logs for adjustments/receipts.


## Appendix A — Common Query Parameters

| Param | Type | Description | Example |
|---|---|---|---|
| `page` | integer | 1‑based page index | `?page=2` |
| `limit` | integer | Page size (max 100) | `?limit=50` |
| `sort` | string | Comma‑separated fields; prefix with `-` for desc | `?sort=name,-updated_at` |
| `fields` | string | Sparse fieldsets | `?fields=id,name,price` |
| `expand` | string | Include related resources (implementation‑dependent) | `?expand=category,supplier` |

## Appendix B — Sample Validation Errors

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid request body",
    "details": {
      "sku": ["must be unique"],
      "price": ["must be greater than or equal to 0"]
    },
    "correlation_id": "08e4b6ba-54a2-4f3d-a3a2-2d7a9b8d0abc"
  }
}


