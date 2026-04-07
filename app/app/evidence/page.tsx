import type { Metadata } from "next";
import Link from "next/link";
import WebinarPlayer from "../components/WebinarPlayer";

export const metadata: Metadata = {
  title: "The Evidence — Peak Sentinel",
  description:
    "CO2 pipeline physics, CCS track record, Planning Inspectorate criticisms, and real incidents.",
};

const SCOPING_CRITICISMS = [
  {
    id: "3.14",
    text: "CO\u2082 dispersion modelling inadequate — terrain-following behaviour of dense CO\u2082 not assessed",
  },
  {
    id: "3.5\u20133.10",
    text: "Impacts on designated nature conservation sites not fully assessed. 8 Ancient Woodlands in the corridor — irreplaceable habitats",
  },
  {
    id: "3.11",
    text: "Pipeline route passes through the Peak District National Park",
  },
  {
    id: "4.7\u20134.8",
    text: "Major accident and disaster risk assessment must consider CO\u2082 pipeline-specific hazards. Quantified Risk Assessment must cover the full route including populated areas",
  },
  {
    id: "4.9\u20134.10",
    text: "Sensitive receptors (schools, hospitals, care homes) not identified. Emergency planning for CO\u2082 release near populated areas not adequately addressed",
  },
  {
    id: "3.23\u20133.24",
    text: "Landscape and Visual Impact Assessment must cover all AGI locations, including the 50m Coastal AGI vent stack",
  },
  {
    id: "4.22",
    text: "Socio-economic impacts including property values not scoped into the assessment",
  },
];

function ProjectCard({
  name,
  country,
  year,
  cost,
  status,
  statusColor,
  detail,
  eor,
}: {
  name: React.ReactNode;
  country: string;
  year: string;
  cost: string;
  status: React.ReactNode;
  statusColor: string;
  detail: React.ReactNode;
  eor?: boolean;
}) {
  return (
    <details className="group bg-white/8 border border-white/10 rounded-lg">
      <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white font-bold">{name}</span>
          <span className="text-gray-500 text-sm shrink-0">
            {country}, {year}
          </span>
          {eor && (
            <span
              title="Enhanced Oil Recovery — captured CO₂ used to extract more fossil fuels"
              className="text-[10px] font-bold bg-orange-900/50 text-orange-400 border border-orange-800/50 rounded px-1.5 py-0.5 shrink-0 cursor-help"
            >
              EOR
            </span>
          )}
        </div>
        <span className={`text-sm font-medium shrink-0 ${statusColor}`}>
          {status}
        </span>
      </summary>
      <div className="px-4 pb-4 pt-0 border-t border-white/5">
        <div className="text-gray-400 text-sm mt-3">{detail}</div>
        <div className="text-gray-600 text-xs mt-2">Cost: {cost}</div>
      </div>
    </details>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-[#FFD700] mt-12 mb-4">{children}</h2>
  );
}

function Stat({
  value,
  label,
  color = "text-red-500",
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function EvidencePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-[#FFD700] mb-2">The Evidence</h1>
      <p className="text-gray-400 mb-12">
        What they don&apos;t tell you about CO&#8322; pipelines.
      </p>

      {/* ── Section 1: Physics ────────────────────────────────── */}
      <SectionHeading>The Physics of CO&#8322; Pipeline Failure</SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          CO&#8322; pipelines behave nothing like natural gas pipelines. Every
          physical property that matters works against public safety:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 pr-4 text-[#FFD700]"> </th>
                <th className="text-left py-2 pr-4 text-[#FFD700]">
                  Natural Gas
                </th>
                <th className="text-left py-2 text-[#FFD700]">CO&#8322;</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/10">
                <td className="py-2 pr-4 text-white font-medium">Density</td>
                <td className="py-2 pr-4">
                  Lighter than air, rises and disperses
                </td>
                <td className="py-2 text-red-400">
                  1.5&times; heavier than air, sinks into low ground
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-2 pr-4 text-white font-medium">Hazard</td>
                <td className="py-2 pr-4">Flammable, ignites then disperses</td>
                <td className="py-2 text-red-400">
                  Asphyxiant. Invisible, largely odourless, pools in low areas.
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-2 pr-4 text-white font-medium">Fracture</td>
                <td className="py-2 pr-4">Localised rupture</td>
                <td className="py-2 text-red-400">
                  Ductile fracture can propagate for kilometres as the
                  decompression wave sustains crack growth (&ldquo;zipper
                  effect&rdquo;)
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-2 pr-4 text-white font-medium">Pressure</td>
                <td className="py-2 pr-4">Typically 70 bar</td>
                <td className="py-2 text-red-400">
                  85&ndash;150 bar in dense phase. Peak Cluster stated 40 bar at
                  the Wirral webinar, likely a receiving-end or section pressure
                  rather than the main pipeline operating pressure
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-white font-medium">Detection</td>
                <td className="py-2 pr-4">Mercaptan odorant added</td>
                <td className="py-2 text-red-400">
                  No odorant added. No colour. Undetectable until symptoms
                  begin.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6 mt-8">
          <h3 className="text-white font-bold mb-3">
            CO&#8322; concentration effects
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat
              value="4%"
              label="NIOSH danger-to-life threshold"
              color="text-amber-400"
            />
            <Stat
              value="5%"
              label="headache, dizziness, breathlessness"
              color="text-orange-500"
            />
            <Stat
              value="7–10%"
              label="unconsciousness within minutes"
              color="text-red-500"
            />
            <Stat
              value="10%+"
              label="convulsions, coma, death"
              color="text-red-700"
            />
          </div>
          <p className="text-gray-500 text-xs mt-3">
            Sources:{" "}
            <a
              href="https://www.cdc.gov/niosh/idlh/124389.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-400"
            >
              NIOSH IDLH Documentation
            </a>
            ,{" "}
            <a
              href="https://en.wikipedia.org/wiki/Carbon_dioxide#Toxicity"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-400"
            >
              CO&#8322; toxicity (Wikipedia)
            </a>
          </p>
        </div>

        <p>
          CO&#8322; pools in valleys, basements, and any low-lying ground. The
          Wirral corridor crosses multiple topographic depressions where a
          release would accumulate. Our map identifies{" "}
          <strong className="text-white">129 topographic sinks</strong> within
          2km of the proposed route.
        </p>
      </div>

      {/* ── Section 2: Scoping Opinion ───────────────────────── */}
      <SectionHeading>What the Planning Inspectorate Said</SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          The Planning Inspectorate&apos;s Scoping Opinion identified{" "}
          <strong className="text-[#FFD700]">
            29 instances where it does NOT agree
          </strong>{" "}
          with the applicant&apos;s proposed approach. Key criticisms:
        </p>

        <div className="space-y-2">
          {SCOPING_CRITICISMS.map((c) => (
            <div
              key={c.id}
              className="flex items-baseline gap-3 bg-white/8 border border-white/10 rounded p-3"
            >
              <span className="text-[#FFD700] font-mono text-sm w-20 shrink-0 text-right">
                {c.id}
              </span>
              <span className="text-gray-300">{c.text}</span>
            </div>
          ))}
        </div>

        <p className="text-gray-500 text-sm">
          Source:{" "}
          <a
            href="https://national-infrastructure-consenting.planninginspectorate.gov.uk/projects/EN0710001/documents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Planning Inspectorate Scoping Opinion (EN0710001)
          </a>
        </p>
      </div>

      {/* ── Section 3: Webinar Admissions ────────────────────── */}
      <SectionHeading>
        What Peak Cluster Stated &mdash; In Their Own Words
      </SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          During their community webinars, Peak Cluster representatives fielded
          direct questions from residents. Many answers were vague or deferred
          to future design stages, while others were disarmingly candid about
          the project&apos;s current gaps.
        </p>
        <p>
          We reviewed both the <strong className="text-white">Wirral</strong>{" "}
          and <strong className="text-white">Cheshire</strong> webinars and
          selected the most significant exchanges. Click any quote to watch them
          say it.
        </p>

        <WebinarPlayer />
      </div>

      {/* ── Section 4: CCS Track Record ──────────────────────── */}
      <SectionHeading>CCS Track Record</SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          The{" "}
          <a
            href="https://ieefa.org/resources/carbon-capture-crux-lessons-learned"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Institute for Energy Economics and Financial Analysis (IEEFA)
          </a>{" "}
          reviewed 13 flagship CCS projects worldwide. According to IEEFA,{" "}
          <strong className="text-red-400">
            10 of 13 have failed or underperformed
          </strong>
          , representing 90% of total capture capacity. After what IEEFA
          estimates at <strong className="text-white">US$33+ billion</strong> in
          public and private investment, CCS has captured a fraction of what was
          promised.
        </p>

        <div className="grid grid-cols-3 gap-4 my-6">
          <Stat value="10/13" label="projects failed or underperformed" />
          <Stat value="$33B+" label="spent on flagship projects" />
          <Stat
            value="7/13"
            label="used CO&#8322; for MORE oil extraction"
            color="text-orange-500"
          />
        </div>

        {/* Expandable project cards */}
        <div className="space-y-3">
          {/* FAILED / UNDERPERFORMING */}
          <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider mt-6">
            Failed or Underperforming
          </h3>

          <ProjectCard
            name="Kemper County IGCC"
            country="USA"
            year="2014–2017"
            cost="US$7.5 billion (budget: US$2.4bn)"
            status="Cancelled"
            statusColor="text-red-500"
            detail={
              <>
                The most expensive CCS failure in history. The budget more than
                tripled from US$2.4bn to US$7.5bn, and years of delays led
                Mississippi Power to abandon the gasification and carbon capture
                components entirely. The plant now runs on natural gas.
                Ratepayers were left with billions in stranded costs.
              </>
            }
            eor
          />

          <ProjectCard
            name="Gorgon"
            country="Australia"
            year="2019–present"
            cost="A$3.1 billion (CCS component)"
            status="Underperforming (~30-50% of target)"
            statusColor="text-red-400"
            detail={
              <>
                The world&apos;s largest dedicated geological storage project,
                operated by Chevron. Plagued by equipment failures, water
                management problems, and sand ingestion. Captured roughly a
                third of its 4 Mtpa target in 2022&ndash;2023, and about half
                cumulatively over its first five years. The Western Australian
                government required Chevron to purchase offsets for the
                shortfall.
              </>
            }
          />

          <ProjectCard
            name="Petra Nova"
            country="USA"
            year="2017–2020"
            cost="US$1 billion"
            status="Mothballed (2020)"
            statusColor="text-red-500"
            detail={
              <>
                Hailed as a success story until it wasn&apos;t. When oil prices
                dropped, the project was shut down because its only purpose was
                to pump captured CO&#8322; into oil wells for Enhanced Oil
                Recovery (EOR). Showed that &ldquo;CCS&rdquo; was functioning as
                an oil production subsidy. Briefly restarted 2023 under new
                ownership.
              </>
            }
            eor
          />

          <ProjectCard
            name="Boundary Dam"
            country="Canada"
            year="2014–present"
            cost="C$1.5 billion"
            status="Underperforming (~50% of target)"
            statusColor="text-red-400"
            detail={
              <>
                The world&apos;s first commercial power-sector CCS project.
                Chronic mechanical problems meant it captured roughly half its 1
                Mtpa design capacity. Most captured CO&#8322; was sold for
                Enhanced Oil Recovery, reducing the net climate benefit.
              </>
            }
            eor
          />

          <ProjectCard
            name="In Salah"
            country="Algeria"
            year="2004–2011"
            cost="Undisclosed"
            status="Suspended (caprock integrity concerns)"
            statusColor="text-red-500"
            detail={
              <>
                Injection halted after satellite monitoring detected ground
                uplift of ~20mm, raising concerns that CO&#8322; could migrate
                through fractures toward the surface. A showcase project for
                geological storage that raised serious questions about long-term
                caprock integrity.
              </>
            }
          />

          <ProjectCard
            name="Shute Creek"
            country="USA"
            year="1986–present"
            cost="Undisclosed"
            status="Underperforming (36% below target)"
            statusColor="text-red-400"
            detail={
              <>
                One of the oldest CCS facilities. Despite nearly 40 years of
                operation, it consistently captures well below its 7 Mtpa design
                capacity. All captured CO&#8322; is used for Enhanced Oil
                Recovery.
              </>
            }
            eor
          />

          <ProjectCard
            name="Great Plains Synfuels"
            country="USA"
            year="2000–present"
            cost="US$2.1 billion (original plant)"
            status={<>Underperforming (20&ndash;30% below target)</>}
            statusColor="text-red-400"
            detail={
              <>
                A coal gasification plant that pipes CO&#8322; to Canada&apos;s
                Weyburn oil field for EOR. After the initial US government loan
                guarantee default, it was sold for US$85 million &mdash; 4% of
                construction cost. Consistently captures below its 3 Mtpa
                target.
              </>
            }
            eor
          />

          <ProjectCard
            name="Illinois Industrial"
            country="USA"
            year="2017–present"
            cost="US$208 million (incl. US$141M DOE funding)"
            status="Underperforming (~50% of target)"
            statusColor="text-red-400"
            detail={
              <>
                An ethanol plant capturing CO&#8322; for geological storage.
                Despite being one of the simplest CCS applications (ethanol
                fermentation produces near-pure CO&#8322;), it has consistently
                fallen short of its 1 Mtpa design capacity.
              </>
            }
          />

          <ProjectCard
            name="Coffeyville"
            country="USA"
            year="2013–present"
            cost="Undisclosed"
            status="Insufficient public data"
            statusColor="text-gray-400"
            detail={
              <>
                A fertiliser plant capturing CO&#8322; for EOR. Performance data
                is not publicly reported, making independent assessment
                impossible &mdash; itself a transparency failure for a publicly
                subsidised technology.
              </>
            }
            eor
          />

          <ProjectCard
            name="Abu Dhabi (Al Reyadah)"
            country="UAE"
            year="2016–present"
            cost="US$122 million"
            status="No performance data published"
            statusColor="text-gray-400"
            detail={
              <>
                A steel plant capturing CO&#8322; for EOR in Abu Dhabi&apos;s
                oil fields. No independent performance data has been published.
                The captured CO&#8322; is used for EOR in Abu Dhabi&apos;s oil
                fields rather than dedicated geological storage.
              </>
            }
            eor
          />

          {/* ON TRACK (with caveats) */}
          <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider mt-8">
            On Track (with caveats)
          </h3>

          <ProjectCard
            name="Sleipner"
            country="Norway"
            year="1996–present"
            cost="Undisclosed"
            status="On track"
            statusColor="text-green-400"
            detail={
              <>
                The longest-running CCS project. Injects CO&#8322; stripped from
                natural gas production into a saline aquifer beneath the North
                Sea. Often cited as proof CCS works &mdash; but it captures
                CO&#8322; that was already separated as part of gas processing,
                incentivised by Norway&apos;s carbon tax, which makes venting
                CO&#8322; financially unviable.
              </>
            }
          />

          <ProjectCard
            name={<>Sn&oslash;hvit</>}
            country="Norway"
            year="2008–present"
            cost="Undisclosed"
            status="On track (after reservoir switch)"
            statusColor="text-green-400"
            detail={
              <>
                Injects CO&#8322; from LNG processing. Had to switch injection
                formations around 2010&ndash;2011 after the original
                Tub&aring;en reservoir showed less capacity than expected. Like
                Sleipner, captures CO&#8322; already separated during gas
                processing.
              </>
            }
          />

          <ProjectCard
            name="Quest"
            country="Canada"
            year="2015–present"
            cost="C$1.35 billion"
            status="On track (captures only 35% of facility emissions)"
            statusColor="text-green-400"
            detail={
              <>
                Operated by Shell at an oil sands upgrader. Meets its 1 Mtpa
                target &mdash; but this represents only about 35% of the
                facility&apos;s total emissions. The remaining 65% goes into the
                atmosphere. The project received C$745 million in government
                subsidies.
              </>
            }
          />
        </div>

        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 mt-6">
          <h3 className="text-white font-bold mb-2">The EOR Problem</h3>
          <p className="text-sm">
            <strong className="text-red-400">7 of the 13</strong> flagship CCS
            projects use captured CO&#8322; for{" "}
            <strong className="text-white">Enhanced Oil Recovery</strong> (EOR)
            &mdash; pumping it underground to extract more fossil fuels. This
            means the &ldquo;captured&rdquo; carbon enables the extraction and
            burning of additional oil, often resulting in a{" "}
            <strong className="text-white">net increase</strong> in emissions
            compared to leaving the oil in the ground. The climate case for CCS
            is substantially weakened when the CO&#8322; is used to produce more
            hydrocarbons.
          </p>
        </div>

        <p className="text-gray-500 text-sm">
          Source:{" "}
          <a
            href="https://ieefa.org/resources/carbon-capture-crux-lessons-learned"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            IEEFA &ldquo;The Carbon Capture Crux&rdquo; (Robertson &amp;
            Mousavian, 2022)
          </a>
        </p>

        <div className="bg-white/8 border border-white/10 rounded-lg p-4 mt-4">
          <h3 className="text-white font-bold mb-3">
            CO&#8322; Is Not Just a Climate Problem &mdash; It Kills
          </h3>
          <div>
            <strong className="text-white">Lake Nyos</strong> (Cameroon, 1986)
            &mdash; A limnic eruption released an estimated 1.6 million tonnes
            of CO&#8322; from a volcanic lake.{" "}
            <strong className="text-red-400">1,746 people killed</strong> in a
            single night as the dense gas flowed downhill through villages. A
            pipeline rupture would release far less CO&#8322;, but the physics
            are identical: the gas sinks, pools, and suffocates.
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Source:{" "}
            <a
              href="https://pubs.usgs.gov/of/1987/0097/report.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              USGS Open-File Report 87-97
            </a>
          </p>
        </div>

        <p>
          Peak Cluster proposes to transport CO&#8322; from cement and lime
          plants through 200km of pipeline to depleted gas fields under the East
          Irish Sea. The developer frames this as decarbonisation; critics note
          it perpetuates fossil-fuel-dependent industries and relies on storage
          in fields operated by a fossil fuel company.
        </p>
      </div>

      {/* ── Section 5: Satartia ─────────────────────────────────── */}
      <SectionHeading>The Satartia Incident (2020)</SectionHeading>

      <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Stat value="200+" label="evacuated" />
          <Stat value="45+" label="hospitalised" />
          <Stat value="0" label="warning time" />
          <Stat value='24"' label="pipeline diameter" />
        </div>
      </div>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          On <strong className="text-white">22 February 2020</strong>, a 24-inch
          Denbury CO&#8322; pipeline ruptured in Yazoo County, Mississippi. A
          rain-induced landslide triggered the failure.
        </p>
        <p>
          The released CO&#8322; &mdash; heavier than air, largely odourless,
          and invisible &mdash; flowed downhill and settled in the valley toward
          the village of Satartia. Over 200 people were evacuated and at least
          45 were hospitalised.
        </p>
        <p>
          Residents collapsed in their homes and on the streets. Vehicle engines
          stalled because CO&#8322; displaces oxygen &mdash;{" "}
          <strong className="text-red-400">
            ambulances could not reach the victims
          </strong>
          . According to witness accounts, a green-tinted cloud sat in the
          valley for hours.
        </p>
        <p className="text-gray-500 text-sm">
          Source: PHMSA Failure Investigation Report &mdash; Denbury Gulf Coast
          Pipelines (May 2022).{" "}
          <a
            href="https://www.pstrust.org/wp-content/uploads/2022/05/PR-5.26.22-Denbury-Failure-Report-FINAL.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Report PDF (Pipeline Safety Trust mirror)
          </a>
        </p>
      </div>

      {/* ── Section 6: Sulphur, Louisiana ─────────────────────── */}
      <SectionHeading>Sulphur, Louisiana (2024)</SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          In <strong className="text-white">April 2024</strong>, the same
          operator (Denbury, now owned by ExxonMobil) suffered another CO&#8322;
          pipeline release in Sulphur, Louisiana &mdash; approximately{" "}
          <strong className="text-white">2,548 barrels</strong> of liquid
          CO&#8322; from a 24-inch pipeline at the Lake Charles Pumping Station.
        </p>
        <p>
          This was not a one-off. It demonstrated that the fundamental risks of
          dense-phase CO&#8322; transport{" "}
          <strong className="text-red-400">have not been solved</strong> despite
          four years of &ldquo;lessons learned&rdquo; from Satartia. PHMSA has
          recorded{" "}
          <strong className="text-white">
            76 CO&#8322; pipeline incidents industry-wide since 2010
          </strong>
          . Denbury was responsible for 12 of them, but those 12 account for
          roughly 81% of all CO&#8322; volume released.
        </p>
        <p className="text-gray-500 text-sm">
          Source:{" "}
          <a
            href="https://news.oilandgaswatch.org/post/data-shows-denburys-carbon-pipelines-leak-more-than-any-other-co2-pipeline-companys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Oil &amp; Gas Watch analysis of PHMSA data (July 2024)
          </a>
        </p>
      </div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <div className="mt-16 mb-8 text-center">
        <Link
          href="/"
          className="inline-block bg-[#FFD700] text-black font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Take Action &rarr;
        </Link>
      </div>
    </div>
  );
}
