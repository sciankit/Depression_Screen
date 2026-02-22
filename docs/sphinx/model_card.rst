Model Card
==========


Overview
--------


**Name:** MoodLens Passive Risk Stratification

**Version:** 0.1.0

**Intended Use:** Early warning and behavioral support for mental-health risk trends. Not diagnostic.

Inputs
------


- Heart-rate and HRV derived metrics
- Sleep timing and variability signals
- Activity rhythm and movement regularity
- Communication frequency deltas (metadata-level)

Outputs
-------


- Risk tier: low | moderate | critical
- Top contributing signals
- Intervention guidance tier

Known Limitations
-----------------


- Cannot diagnose depression, substance-use disorder, or suicidality.
- Sensitive to missing sensor data and sparse baseline windows.
- Requires explicit consent and governance for escalation actions.
