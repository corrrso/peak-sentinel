"""
09_objections.py — Generate objection letter template blocks.

Creates a JSON file with template paragraphs keyed by risk condition.
The frontend assembles these into a personalised objection letter
based on the user's postcode risk profile.

Input:  Scoping Opinion analysis (hardcoded references)
Output: data/processed/objection_templates.json
        data/processed/scoping_refs.json
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import json
from scripts.utils import PROCESSED_DIR


TEMPLATES = {
    "intro": {
        "title": "Introduction",
        "text": (
            "I am writing to formally register my objection to the Peak Cluster "
            "Carbon Dioxide Pipeline (PINS reference EN070007). As a resident of "
            "{postcode}, I am directly affected by the proposed development and "
            "wish to raise the following serious concerns."
        ),
    },
    "proximity": {
        "title": "Proximity Risk",
        "condition": "distance_m < 2000",
        "text": (
            "My property is approximately {distance_m} metres from the proposed "
            "pipeline corridor. The Health and Safety Executive's guidance on "
            "major accident hazard pipelines indicates that dense-phase CO\u2082 "
            "pipelines pose unique risks not comparable to natural gas pipelines. "
            "A running fracture in a CO\u2082 pipeline can release enormous volumes "
            "of asphyxiant gas. The Scoping Opinion (paragraphs 3.14, 4.7-4.8) "
            "notes that the applicant has NOT adequately assessed CO\u2082 "
            "dispersion and asphyxiation risks."
        ),
    },
    "topo_sink": {
        "title": "Topographic Sink — CO\u2082 Accumulation Risk",
        "condition": "in_topo_sink",
        "text": (
            "My property is located in a topographic depression (estimated depth "
            "~{sink_depth_m}m below surrounding terrain). CO\u2082 is 1.5 times "
            "heavier than air and, in the event of a pipeline breach, would flow "
            "downhill and accumulate in low-lying areas such as this. "
            "Concentrations above 10% are immediately fatal. The developer's own "
            "EIA Scoping Report fails to model terrain-following CO\u2082 "
            "dispersion, a deficiency highlighted by the Planning Inspectorate "
            "in its Scoping Opinion (paragraph 3.14)."
        ),
    },
    "viewshed": {
        "title": "Visual Impact — Coastal AGI",
        "condition": "in_viewshed",
        "text": (
            "The proposed Coastal AGI, including a 50-metre vent stack, would be "
            "clearly visible from my property. The developer's own Zone of "
            "Theoretical Visibility analysis confirms that this industrial "
            "installation would be visible across the majority of the Wirral "
            "peninsula. This represents a significant and permanent adverse "
            "visual impact on a predominantly residential and recreational area. "
            "The Scoping Opinion (paragraphs 3.23-3.24) raises concerns about "
            "the adequacy of the landscape and visual impact assessment."
        ),
    },
    "property_impact": {
        "title": "Property Value Impact",
        "condition": "depreciation_pct < 0",
        "text": (
            "Academic research consistently demonstrates that proximity to major "
            "hazardous pipelines depreciates property values. Based on published "
            "studies, I estimate a depreciation of approximately {depreciation_pct}% "
            "for my property, representing a potential loss of \u00a3{est_loss_gbp:,}. "
            "There is no proposal for compensation to affected homeowners."
        ),
    },
    "nearby_env": {
        "title": "Environmental Designations at Risk",
        "condition": "len(nearby_env) > 0",
        "text": (
            "The proposed corridor passes through or near the following protected "
            "sites: {nearby_env_list}. The Planning Inspectorate's Scoping Opinion "
            "(paragraphs 3.5-3.10) identifies serious deficiencies in the "
            "developer's assessment of impacts on designated sites, including "
            "the failure to consult with Natural England on several designations. "
            "Eight Ancient Woodlands lie within the corridor — irreplaceable "
            "habitats that would be permanently damaged by construction."
        ),
    },
    "nearby_schools": {
        "title": "Schools and Vulnerable Populations",
        "condition": "len(nearby_schools) > 0",
        "text": (
            "The following schools are located near the proposed corridor: "
            "{nearby_schools_list}. The presence of a high-pressure CO\u2082 "
            "pipeline near places where children gather daily represents an "
            "unacceptable risk. The Scoping Opinion (paragraphs 4.9-4.10) "
            "notes inadequate consideration of sensitive receptors."
        ),
    },
    "closing": {
        "title": "Conclusion",
        "text": (
            "For the reasons set out above, I urge the Planning Inspectorate to "
            "refuse this application. The Peak Cluster project poses unacceptable "
            "risks to public safety, property values, and the environment, while "
            "serving primarily to extend the operational life of fossil fuel "
            "extraction in the East Irish Sea.\n\n"
            "I reserve the right to make further representations as the "
            "examination process progresses.\n\n"
            "Yours faithfully,\n"
            "[Your name]\n"
            "[Your address]"
        ),
    },
}


SCOPING_REFS = {
    "2.1": "The SoS has decided to accept the application for examination.",
    "2.2": "29 matters where the Inspectorate does NOT agree with the applicant's proposed approach.",
    "2.3": "The applicant must demonstrate compliance with all relevant legislation and policy.",
    "3.5": "Impacts on designated nature conservation sites must be fully assessed.",
    "3.6": "Habitats Regulations Assessment required for SAC/SPA sites.",
    "3.7": "Dee Estuary SAC/SPA/Ramsar — requires full assessment of construction and operational impacts.",
    "3.9": "Ancient Woodland impacts — the ES must assess impacts on all ancient woodland within the corridor.",
    "3.10": "8 Ancient Woodlands identified within the scoping boundary.",
    "3.11": "Peak District National Park — pipeline route passes through the National Park.",
    "3.14": "CO2 dispersion modelling inadequate — terrain-following behaviour of dense CO2 not assessed.",
    "3.23": "Landscape and Visual Impact Assessment must cover all AGI locations.",
    "3.24": "Zone of Theoretical Visibility should account for the 50m Coastal AGI vent stack.",
    "4.7": "Major accident and disaster risk assessment must consider CO2 pipeline-specific hazards.",
    "4.8": "Quantified Risk Assessment must cover the full pipeline route including populated areas.",
    "4.9": "Sensitive receptors (schools, hospitals, care homes) must be identified and assessed.",
    "4.10": "Emergency planning for CO2 release near populated areas not adequately addressed.",
    "4.15": "Visual impact of Coastal AGI on Wirral residential areas.",
    "4.22": "Socio-economic impacts including property values not scoped into the assessment.",
}


def main():
    print("=== 09_objections.py ===\n")

    # Save templates
    out_templates = PROCESSED_DIR / "objection_templates.json"
    with open(out_templates, "w") as f:
        json.dump(TEMPLATES, f, indent=2, ensure_ascii=False)
    print(f"Saved {out_templates.name}: {len(TEMPLATES)} template blocks")

    # Save scoping refs
    out_refs = PROCESSED_DIR / "scoping_refs.json"
    with open(out_refs, "w") as f:
        json.dump(SCOPING_REFS, f, indent=2, ensure_ascii=False)
    print(f"Saved {out_refs.name}: {len(SCOPING_REFS)} references")

    # Preview a sample letter
    print("\n--- Sample letter (postcode CH63 0AA, 350m, in sink, in viewshed) ---\n")
    sample = {
        "postcode": "CH63 0AA",
        "distance_m": 350,
        "in_topo_sink": True,
        "sink_depth_m": 3.5,
        "in_viewshed": True,
        "depreciation_pct": -11.2,
        "est_loss_gbp": 31360,
        "nearby_env": ["sac: Dee Estuary"],
        "nearby_schools": ["Eastham Rake Primary School"],
    }

    for key in ["intro", "proximity", "topo_sink", "viewshed", "property_impact",
                "nearby_env", "nearby_schools", "closing"]:
        tmpl = TEMPLATES[key]
        text = tmpl["text"].format(
            postcode=sample["postcode"],
            distance_m=sample["distance_m"],
            sink_depth_m=sample.get("sink_depth_m", "N/A"),
            depreciation_pct=sample["depreciation_pct"],
            est_loss_gbp=sample["est_loss_gbp"],
            nearby_env_list=", ".join(sample["nearby_env"]),
            nearby_schools_list=", ".join(sample["nearby_schools"]),
        )
        print(f"[{tmpl['title']}]")
        print(text)
        print()

    print("=== Done! ===")


if __name__ == "__main__":
    main()
