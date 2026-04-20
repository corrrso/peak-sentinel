import type { Metadata } from "next";
import Link from "next/link";
import WebinarPlayer from "../components/WebinarPlayer";
import EvidenceSidebar from "../components/EvidenceSidebar";

export const metadata: Metadata = {
  title: "The Evidence — Peak Sentinel",
  description:
    "CO2 pipeline physics, CCS track record, Planning Inspectorate criticisms, and real incidents.",
};

const SCOPING_CHAPTERS = [
  {
    chapter: "3.1",
    title: "Air Quality",
    items: [
      {
        id: "3.1.2",
        text: "Dust emissions during decommissioning not assessed",
      },
      {
        id: "3.1.3",
        text: "Vehicle movement air quality impacts during operation and decommissioning not assessed",
      },
      {
        id: "3.1.10",
        text: "Emissions from AGIs not explained. Coastal AGI includes a 50m stack with no justification or assessment of what it will emit",
      },
    ],
  },
  {
    chapter: "3.3",
    title: "Landscape and Visual",
    items: [
      {
        id: "3.3.6",
        text: "Long-term effects on landscape character during construction and decommissioning from capture facilities and AGIs",
      },
      {
        id: "3.3.7",
        text: "Long-term effects on landscape character from pipeline corridors during all phases",
      },
      {
        id: "3.3.10",
        text: "Long-term effects on Landscape Character Areas within the LVIA study area",
      },
      {
        id: "3.3.11",
        text: "Long-term effects on Landscape Character Areas from pipeline corridors during all phases",
      },
      {
        id: "3.3.13",
        text: "Temporary effects on the Peak District National Park\u2019s statutory purposes and special landscape qualities",
      },
      {
        id: "3.3.14",
        text: "Permanent effects on the Peak District National Park. The pipeline runs through the National Park",
      },
      {
        id: "3.3.15",
        text: "Permanent effects on the PDNP and its setting during all phases",
      },
      {
        id: "3.3.18",
        text: "Long-term effects on people\u2019s views and visual amenity from AGIs and capture facilities",
      },
      {
        id: "3.3.19",
        text: "Long-term effects on views and visual amenity from pipeline corridors during all phases",
      },
    ],
  },
  {
    chapter: "3.4",
    title: "Traffic and Movement",
    items: [
      {
        id: "3.4.1",
        text: "Decommissioning traffic impacts not assessed: severance, driver delay, non-motorised user delay, amenity, fear and intimidation all scoped out",
      },
      {
        id: "3.4.3",
        text: "Hazardous and large loads during operation and decommissioning not assessed",
      },
    ],
  },
  {
    chapter: "3.6",
    title: "Historic Environment",
    items: [
      {
        id: "3.6.13",
        text: "Physical impacts to below-ground archaeological remains during operation. Groundwater changes from the pipeline could deteriorate remains",
      },
    ],
  },
  {
    chapter: "3.7",
    title: "Water Environment and Flood Risk",
    items: [
      {
        id: "3.7.1",
        text: "Fluvial flood risk to capture facilities located in Flood Zones 2 and 3 during operation",
      },
      {
        id: "3.7.9",
        text: "Reservoir flood risk to pipeline and Coastal AGI during all phases. \u2018Managed risk\u2019 not defined or explained",
      },
    ],
  },
  {
    chapter: "3.10",
    title: "Socio-economics",
    items: [
      {
        id: "3.10.3",
        text: "Impacts on communities, facilities, visitor attractions and businesses not assessed. Design not finalised, avoidance of significant effects not assured",
      },
      {
        id: "3.10.4",
        text: "Impacts on residential properties during operation. Loss of property, access and amenity not assessed",
      },
    ],
  },
  {
    chapter: "3.14",
    title: "Major Accidents and Disasters",
    items: [
      {
        id: "3.14.50",
        text: "Tidal flooding risk on the Wirral peninsula during construction and decommissioning",
      },
      {
        id: "3.14.51",
        text: "Fluvial flooding where pipeline and AGIs cross Flood Zones 2 and 3",
      },
      {
        id: "3.14.57",
        text: "Wave surge risk to coastal pipeline and AGIs during construction and decommissioning",
      },
      {
        id: "3.14.58",
        text: "Extreme temperature impacts including heatwaves during all phases",
      },
      {
        id: "3.14.68",
        text: "Mine and storage cavern risks. Pipeline crosses multiple coal mining reporting areas",
      },
      {
        id: "3.14.69",
        text: "Fire risk at AGIs, BVSs and along the pipeline during all phases",
      },
      {
        id: "3.14.71",
        text: "Waterway crossing risks during operation and decommissioning",
      },
      {
        id: "3.14.80",
        text: "Unexploded ordnance in high-risk area within the scoping boundary",
      },
      {
        id: "3.14.84",
        text: "Flood defence failure risk during all phases. Contradicts the applicant\u2019s own scoping table",
      },
    ],
  },
  {
    chapter: "13.4",
    title: "Land Use (Natural England)",
    items: [
      {
        id: "13.4",
        text: "Agricultural Land Classification survey too narrow. Natural England requires a full ALC survey across the entire order limits, not just focussed areas",
      },
    ],
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
      <summary className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 p-4 cursor-pointer list-none">
        <div className="flex items-center gap-2 flex-wrap">
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

function SectionHeading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold text-[#FFD700] mt-12 mb-4 scroll-mt-20"
    >
      {children}
    </h2>
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
      <EvidenceSidebar />
      <h1 className="text-4xl font-bold text-[#FFD700] mb-2">The Evidence</h1>
      <p className="text-gray-400 mb-12">
        All the evidence you need to understand that Peak Cluster is not a good
        idea.
      </p>

      {/* ── Section 1: Physics ────────────────────────────────── */}
      <SectionHeading id="physics">The Physics of CO&#8322; Pipeline Failure</SectionHeading>

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

      {/* ── Section 2: CCS Track Record ──────────────────────── */}
      <SectionHeading id="ccs-track-record">CCS Track Record</SectionHeading>

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

      {/* ── Section 3: Webinar Admissions ────────────────────── */}
      <SectionHeading id="webinar">
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
          We reviewed the webinars held in February and April 2026 and
          selected the most significant exchanges. Click any quote to watch them
          say it.
        </p>

        <WebinarPlayer />
      </div>

      {/* ── Section 4: CO₂ Import Terminal ─────────────────────── */}
      <SectionHeading id="import-terminal">
        CO&#8322; Import Terminal at Stanlow
      </SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          In February 2026, Spirit Energy, Progressive Energy, and Essar Energy
          Transition announced a collaboration to build a{" "}
          <strong className="text-white">
            CO&#8322; shipping import terminal
          </strong>{" "}
          at Stanlow/Tranmere within the Port of Liverpool. The terminal would
          receive CO&#8322; by ship and transport it to Spirit Energy&apos;s
          Morecambe Net Zero store in the East Irish Sea. This is the same
          store that the Peak Cluster pipeline connects to.
        </p>
        <p>
          Spirit Energy&apos;s own director stated they are{" "}
          <em>
            &ldquo;investigating the potential to provide a route to
            decarbonisation for emitters from around the UK via the Stanlow
            site.&rdquo;
          </em>
        </p>
        <p>
          Peak Cluster is presented to local communities as a project to
          decarbonise four cement and lime producers in the Peak District,
          capturing roughly 3 million tonnes of CO&#8322; per year. But the
          Morecambe Net Zero store has{" "}
          <strong className="text-white">one billion tonnes</strong> of capacity,
          and Spirit Energy states it could begin storing{" "}
          <strong className="text-white">
            four million tonnes per year from 2030
          </strong>{" "}
          , already exceeding Peak Cluster&apos;s own output. The shipping
          terminal would bring CO&#8322; from emitters across the country into
          the same infrastructure.
        </p>
        <p>
          The Wirral coast is being positioned as the onshore gateway for a
          national CO&#8322; disposal network, well beyond the four cement and
          lime plants that Peak Cluster presents as its purpose.
        </p>
        <p className="text-gray-500 text-xs">
          Source:{" "}
          <a
            href="https://businesscrack.co.uk/2026/02/23/morecambe-bay-carbon-capture-store-plans-progress/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-300"
          >
            BusinessCrack, 23 February 2026
          </a>
        </p>
      </div>

      {/* ── Section 5: Scoping Opinion ───────────────────────── */}
      <SectionHeading id="planning-inspectorate">What the Planning Inspectorate Said</SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          The Planning Inspectorate&apos;s Scoping Opinion identified{" "}
          <strong className="text-[#FFD700]">
            32 instances where it does NOT agree
          </strong>{" "}
          with the applicant&apos;s proposed approach, spanning 8 assessment
          chapters:
        </p>

        <div className="space-y-6">
          {SCOPING_CHAPTERS.map((ch) => (
            <div key={ch.chapter}>
              <h3 className="text-white font-bold text-sm mb-2">
                <span className="text-[#FFD700] font-mono">{ch.chapter}</span>{" "}
                {ch.title}{" "}
                <span className="text-gray-600 font-normal">
                  ({ch.items.length})
                </span>
              </h3>
              <div className="space-y-1.5">
                {ch.items.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-baseline gap-3 bg-white/8 border border-white/10 rounded p-3"
                  >
                    <span className="text-[#FFD700] font-mono text-sm w-16 shrink-0 text-right">
                      {c.id}
                    </span>
                    <span className="text-gray-300 text-sm">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-500 text-sm mt-4">
          Source:{" "}
          <a
            href="https://nsip-documents.planninginspectorate.gov.uk/published-documents/EN0710001-000018-EN0710001%20-%20EIA%20Scoping%20Opinion.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            Planning Inspectorate Scoping Opinion (EN0710001)
          </a>
        </p>
      </div>

      {/* ── Section 5: Satartia ─────────────────────────────────── */}
      <SectionHeading id="satartia">The Satartia Incident (2020)</SectionHeading>

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
          On <strong className="text-white">22 February 2020</strong>, a
          rain-induced landslide caused a 24-inch Denbury CO&#8322; pipeline to
          rupture in Yazoo County, Mississippi. The gas settled into the valley
          around the village of Satartia. Over 200 people were evacuated and at
          least 45 ended up in hospital.
        </p>
        <p>
          People collapsed in their homes and in the street. Car engines stalled
          because the CO&#8322; displaced the oxygen they need to run, which
          meant{" "}
          <strong className="text-red-400">
            ambulances could not get through
          </strong>
          . Witnesses described a green-tinted cloud hanging in the valley for
          hours. Nobody received any warning.
        </p>
        <p className="text-gray-500 text-sm">
          Source:{" "}
          <a
            href="https://www.pstrust.org/wp-content/uploads/2022/05/PR-5.26.22-Denbury-Failure-Report-FINAL.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            PHMSA Failure Investigation Report, Denbury Gulf Coast Pipelines
            (May 2022)
          </a>
        </p>
      </div>

      {/* ── Section 6: Sulphur, Louisiana ─────────────────────── */}
      <SectionHeading id="sulphur">Sulphur, Louisiana (2024)</SectionHeading>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          In <strong className="text-white">April 2024</strong>, the same
          operator (Denbury, now owned by ExxonMobil) had another CO&#8322;
          release in Sulphur, Louisiana. About{" "}
          <strong className="text-white">2,548 barrels </strong> of liquid
          CO&#8322; escaped from a 24-inch pipeline at the Lake Charles Pumping
          Station.
        </p>
        <p>
          Four years after Satartia, the fundamental risks of moving dense-phase
          CO&#8322; through pipelines{" "}
          <strong className="text-red-400">remain unsolved</strong>. PHMSA has
          recorded{" "}
          <strong className="text-white">
            76 CO&#8322; pipeline incidents industry-wide since 2010
          </strong>
          . Denbury was responsible for 12, but those 12 account for roughly 81%
          of all CO&#8322; volume released.
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

      {/* ── Section 7: Holcim / Lafarge ─────────────────────── */}
      <SectionHeading id="holcim">
        Peak Cluster Partner Convicted of Financing ISIS
      </SectionHeading>

      <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat value="$6.5M" label="paid to jihadist groups" />
          <Stat
            value="6 yrs"
            label="jail for former CEO"
            color="text-orange-500"
          />
          <Stat value="$778M" label="US penalty (2022)" />
          <Stat value="8" label="employees found guilty" color="text-red-400" />
        </div>
      </div>

      <div className="space-y-4 text-gray-300 leading-relaxed">
        <p>
          <strong className="text-white">Holcim</strong> operates the Cauldon
          cement works and is one of four industrial partners in{" "}
          <strong className="text-white">Peak Cluster Limited</strong>, the
          joint venture developing this pipeline. Holcim acquired Lafarge in
          2015.
        </p>
        <p>
          On <strong className="text-white">11 April 2026</strong>, a Paris
          court found <strong className="text-red-400">Lafarge guilty</strong>{" "}
          of financing terrorism, including Islamic State. Between 2013 and
          2014, Lafarge paid $6.5 million to jihadist groups to keep its cement
          plant running in northern Syria. The court described these payments as
          a{" "}
          <strong className="text-white">
            &ldquo;genuine commercial partnership with IS&rdquo;
          </strong>
          .
        </p>
        <p>
          Eight former employees were convicted. Former CEO Bruno Lafont was
          sentenced to six years in prison. Former deputy managing director
          Christian Herrault received five years. Firas Tlass, a Syrian
          ex-employee who made the payments, was sentenced in absentia to seven
          years.
        </p>
        <p>
          This was the first time a company was tried in France for financing
          terrorism. The conviction follows a 2022 case in the United States
          where Lafarge admitted supporting proscribed groups and agreed to pay
          a <strong className="text-white">$777.8 million</strong> penalty.
        </p>

        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 mt-2">
          <p className="text-sm">
            A separate French investigation into Lafarge&apos;s{" "}
            <strong className="text-white">
              complicity in crimes against humanity
            </strong>{" "}
            in Syria remains ongoing.
          </p>
        </div>

        <p>
          Holcim told the BBC it acknowledged the court&apos;s finding, calling
          it a &ldquo;legacy matter involving conduct that occurred more than a
          decade ago&rdquo;. The Cauldon plant capturing CO&#8322; for Peak
          Cluster is a different facility, but the conviction raises serious
          questions about the corporate governance and due diligence of a key
          consortium partner.
        </p>

        <p className="text-gray-500 text-sm">
          Source:{" "}
          <a
            href="https://www.bbc.co.uk/news/articles/crl1441816po"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            BBC News: French cement giant guilty of financing militant groups
            including Islamic State (April 2026)
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
