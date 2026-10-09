# Plan Feature Matrix

## Contractor OS
| Feature | Starter | Business | Professional |
|---------|---------|----------|--------------|
| Projects | 3 | 15 | Unlimited |
| Users | 5 | 25 | Unlimited |
| BOQ | Yes | Yes | Yes |
| Measurement | Yes | Yes | Yes |
| RA Billing | No | Yes | Yes |
| Advanced Reports | No | Yes | Yes |
| API Access | No | No | Yes |

## Supply OS
| Feature | Starter | Business | Professional |
|---------|---------|----------|--------------|
| Users | 3 | 15 | Unlimited |
| Products | 100 | 1000 | Unlimited |
| Inventory | Basic | Advanced | Advanced |
| E-Way Bill | No | Yes | Yes |

## Diagnostics OS
| Feature | Starter | Business | Professional |
|---------|---------|----------|--------------|
| Patients/Mo | 500 | 2000 | Unlimited |
| PDF Reports | Yes | Yes | Yes |
| Home Collection | No | Yes | Yes |
| B2B Portal | No | No | Yes |

*Note: All feature entitlements are stored as JSON in `OSPlan.featureEntitlements` and enforced via backend middleware `requirePlanFeature(featureKey)`.*
