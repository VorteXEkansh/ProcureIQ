# Procurement Methodology

ProcureIQ uses deterministic formulas and rules. The same input produces the same output. Recommendations are decision support, not guarantees.

## Spend, ABC and Pareto

Line spend includes purchase value, freight and inspection. ABC ranks materials by descending spend: A continues while prior cumulative share is below 80%, B below 95%, then C. Pareto returns the smallest descending set reaching approximately 80%. These are value-management tools and should be combined with material criticality.

## Concentration

Top-one, top-three and top-five shares are calculated from supplier spend. HHI is:

```text
HHI = Σ supplier shareᵢ² × 10,000
```

A high HHI signals concentration, but tooling, sub-tier and geographic dependencies are not included.

## Purchase price variance

```text
PPV = (actual unit price − standard price) × actual quantity
```

Positive PPV is adverse; negative is favourable. A valid specification or commodity-index change can still explain adverse PPV.

## Supplier scoring

Raw metrics are normalized to 0–100. Lower price index, defect rate, variability and risk are better; higher OTD, terms and flexibility are better. Default weights are cost 25%, quality 25%, delivery 20%, reliability 15%, commercial 5% and risk 10%. Weights must total 100%.

## Operational supplier risk

The internal risk score weights delivery variation, quality variation, capacity utilization, sourcing concentration, lead-time variation and deterioration trend. Bands are Low (<32), Moderate (32–54), High (55–74) and Critical (≥75). It is not a financial credit score.

## Total cost of ownership

```text
TCO = purchase + freight + inspection + expected quality
    + pipeline inventory carrying + expected delay + administration
```

Expected quality uses volume × rejection rate × rework/replacement cost. Expected delay uses event probability × event cost. These are probabilistic estimates.

## Inventory carrying

```text
Pipeline inventory = daily demand × supplier lead time
Carrying cost = pipeline inventory × unit value × annual carrying rate
```

This is intentionally understandable. A production implementation may separate cycle stock, safety stock and pipeline ownership.

## Should-cost

Net material equals gross weight × raw-material rate less recoverable scrap. Each operation includes cycle-time machine and labour cost, setup allocated across batch size, tooling and utilities. Overhead applies to material plus conversion. Packaging, freight and supplier margin finish the model. Low and high values use controlled −6%/+8% target sensitivity to avoid false precision.

## RFQ evaluation

Every bid uses the same requested quantity and carrying-rate basis. Evaluated cost adds landed price, expected quality, lead-time inventory, payment-term effect and a restrained operational-risk adjustment. “Lowest quotation,” “lowest evaluated cost” and “recommended offer” are deliberately separate outputs.

## Sourcing optimization

The solver sorts eligible suppliers by expected unit TCO and allocates within supplier capacity and maximum share. Positive allocations respect MOQ/minimum allocation; excluded, low-quality or high-risk suppliers receive zero. Total allocation must equal demand. Infeasibility is returned explicitly.

## Negotiation

```text
Net value = price savings − incremental carrying cost
          + payment-term value − freight impact − quality impact
```

Break-even MOQ solves for the added average inventory that fully consumes price savings.

## Scenario simulation

Demand, raw material, quotation, freight, lead time, defects, capacity and carrying rates adjust baseline spend/TCO/risk using documented factors. Results are comparative stress tests, not forecasts.

## Savings and overlap

Opportunities use conservative capture factors on measurable adverse PPV, quality leakage, freight, fragmentation, should-cost gap, terms and allocation exposure. If multiple levers share an overlap group, only the first ranked value contributes to the executive total.
