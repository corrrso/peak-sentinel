"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Quote = {
  question: string;
  question_timestamp_seconds: number;
  question_timestamp_display: string;
  speaker: string;
  answer: string;
  theme: string;
};

type Webinar = {
  id: string;
  videoId: string;
  label: string;
  date: string;
  quotes: Quote[];
};

const THEME_LABELS: Record<string, { label: string; color: string }> = {
  no_local_benefit: { label: "No local benefit", color: "text-amber-400" },
  evasive_answer: { label: "Evasive answer", color: "text-red-400" },
  emergency_unpreparedness: {
    label: "No emergency plan",
    color: "text-red-500",
  },
  biodiversity_unknown: {
    label: "Biodiversity unknown",
    color: "text-green-400",
  },
  compulsory_purchase: {
    label: "Compulsory purchase",
    color: "text-purple-400",
  },
  property_dismissal: {
    label: "Property impact denied",
    color: "text-orange-400",
  },
  eia_independence: { label: "EIA independence", color: "text-blue-400" },
  no_alternative: { label: "No alternative route", color: "text-gray-400" },
  unanswered_questions: { label: "Questions dodged", color: "text-gray-400" },
  safety_evasion: { label: "Safety evasion", color: "text-red-500" },
  design_not_ready: { label: "Design incomplete", color: "text-amber-400" },
  proximity_to_homes: { label: "Close to homes", color: "text-red-400" },
  pipeline_expansion: { label: "Hidden expansion", color: "text-purple-400" },
  incomplete_capture: {
    label: "Incomplete capture",
    color: "text-orange-400",
  },
  eia_incomplete: { label: "EIA incomplete", color: "text-blue-400" },
  route_predetermined: {
    label: "Route predetermined",
    color: "text-gray-400",
  },
  green_belt_spin: { label: "Green belt spin", color: "text-green-400" },
  construction_disruption: {
    label: "Construction disruption",
    color: "text-amber-400",
  },
  perpetual_deferral: { label: "Perpetual deferral", color: "text-gray-400" },
};

const WIRRAL_QUOTES: Quote[] = [
  {
    question:
      "What are the tangible long-term benefits to Wirral communities, and how many jobs will be created?",
    question_timestamp_seconds: 3728,
    question_timestamp_display: "62:08",
    speaker: "John (Progressive Energy)",
    answer:
      "The industry isn\u2019t here on the Wirral. In fact, you know, there isn\u2019t that much carbon intensive industry on the Wirral.",
    theme: "no_local_benefit",
  },
  {
    question:
      "The 1,500 jobs figure \u2014 will those be local jobs for Wirral residents?",
    question_timestamp_seconds: 3728,
    question_timestamp_display: "62:08",
    speaker: "John (Progressive Energy)",
    answer:
      "Clearly construction of pipelines, construction of carbon capture facilities, those will be with specialist contractors.",
    theme: "no_local_benefit",
  },
  {
    question:
      "How often will it be necessary to vent CO\u2082? What evidence do you have on the impact on humans and local wildlife?",
    question_timestamp_seconds: 4597,
    question_timestamp_display: "76:37",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer:
      "I don\u2019t think I can answer all your questions in the level of detail that I suspect you\u2019d like because we are still doing the design.",
    theme: "evasive_answer",
  },
  {
    question:
      "What volumes of CO\u2082 would be released during venting near residential areas?",
    question_timestamp_seconds: 4597,
    question_timestamp_display: "76:37",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer:
      "We don\u2019t have precise numbers on the amount of CO\u2082 that would be vented because we haven\u2019t completed the design.",
    theme: "evasive_answer",
  },
  {
    question:
      "Can you say more about the dispersions analysis and its findings?",
    question_timestamp_seconds: 4597,
    question_timestamp_display: "76:37",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer:
      "I don\u2019t think I can say that much more on it at the moment because we are undertaking our studies. We\u2019re doing dispersions analysis to confirm the design.",
    theme: "evasive_answer",
  },
  {
    question: "How would you inform residents in case of an emergency?",
    question_timestamp_seconds: 4631,
    question_timestamp_display: "77:11",
    speaker: "John (Progressive Energy)",
    answer: "I think we\u2019re probably a little early for that.",
    theme: "emergency_unpreparedness",
  },
  {
    question:
      "So there\u2019s no emergency notification plan for Wirral residents?",
    question_timestamp_seconds: 4631,
    question_timestamp_display: "77:11",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer: "Yeah, we are a little early for that.",
    theme: "emergency_unpreparedness",
  },
  {
    question:
      "What specific biodiversity improvements are planned for the Wirral?",
    question_timestamp_seconds: 4936,
    question_timestamp_display: "82:16",
    speaker: "Chris Taylor (Peak Cluster)",
    answer:
      "The short answer to this is we don\u2019t yet know because we don\u2019t know exactly where the pipeline will go and we don\u2019t know exactly what impacts we will have.",
    theme: "biodiversity_unknown",
  },
  {
    question:
      "What will happen if landowners don\u2019t permit access to the land?",
    question_timestamp_seconds: 3900,
    question_timestamp_display: "65:00",
    speaker: "Charles (Land/Property)",
    answer:
      "We will be seeking our compulsory purchase powers. And I would stress that is an absolute fallback for the project. We do not want to have to use them but it is something which we need to seek.",
    theme: "compulsory_purchase",
  },
  {
    question: "Can you force entry onto private land even before construction?",
    question_timestamp_seconds: 3900,
    question_timestamp_display: "65:00",
    speaker: "Charles (Land/Property)",
    answer:
      "We do have powers available to us\u2026 to serve notice under the Housing and Planning Act to enter onto the land to undertake those surveys.",
    theme: "compulsory_purchase",
  },
  {
    question: "How would house prices be affected?",
    question_timestamp_seconds: 3917,
    question_timestamp_display: "65:17",
    speaker: "Charles (Land/Property)",
    answer:
      "Having a pipeline located to a property does not materially impact the value of the property\u2026 and there is no study which shows that. However, where there are above ground installations, there could potentially be an impact.",
    theme: "property_dismissal",
  },
  {
    question: "Why is the EIA funded by Peak Cluster \u2014 is it independent?",
    question_timestamp_seconds: 3293,
    question_timestamp_display: "54:53",
    speaker: "Mike (EIA/ARUP-AECOM)",
    answer:
      "Obviously, you know, up front we are paid by Peak Cluster to do the work.",
    theme: "eia_independence",
  },
  {
    question:
      "Could Peak Cluster connect to the existing HyNet system instead of building a new pipeline through the Wirral?",
    question_timestamp_seconds: 2860,
    question_timestamp_display: "47:40",
    speaker: "Chris Taylor (Peak Cluster)",
    answer:
      "That HyNet system, all the capacity in that is already allocated. So that\u2019s not an option for the CO\u2082 from there. So it does need to be a new pipeline system.",
    theme: "no_alternative",
  },
  {
    question:
      "What guarantees does Peak Cluster give to assure the public the disposal of CO\u2082 will be permanent?",
    question_timestamp_seconds: 5240,
    question_timestamp_display: "87:20",
    speaker: "John (Progressive Energy)",
    answer:
      "I recognise there are probably questions in there that we haven\u2019t\u2026 we\u2019ve tried to group them. So I hope we\u2019ve covered, even if it wasn\u2019t precisely your question.",
    theme: "unanswered_questions",
  },
];

const CHESHIRE_QUOTES: Quote[] = [
  {
    question:
      "What are the key things that have determined the route you\u2019re recommending?",
    question_timestamp_seconds: 1552,
    question_timestamp_display: "25:52",
    speaker: "John (Progressive Energy)",
    answer:
      "This does not mean that we can avoid building the pipeline under green belt land\u2026 But actually the other way to think about this is a pipeline like this actually prevents development on certain areas of green belt land.",
    theme: "green_belt_spin",
  },
  {
    question:
      "What are the impacts on the community \u2014 noise, land purchase, traffic management?",
    question_timestamp_seconds: 2785,
    question_timestamp_display: "46:25",
    speaker: "Jim Doyle (Consents Manager)",
    answer:
      "We will undertake baseline surveys. So we need to understand what the environment is like now. What\u2019s the ambient noise level? What sort of protected species are there?",
    theme: "eia_incomplete",
  },
  {
    question: "What about compulsory purchase?",
    question_timestamp_seconds: 3023,
    question_timestamp_display: "50:23",
    speaker: "Charles (Land/Property)",
    answer:
      "The project will be seeking its compulsory purchase powers under the development consent order, and we have to let everyone know that.",
    theme: "compulsory_purchase",
  },
  {
    question: "What size will the AGI be?",
    question_timestamp_seconds: 3095,
    question_timestamp_display: "51:35",
    speaker: "John (Progressive Energy)",
    answer:
      "Clearly we\u2019ve not done the detail design because this is a relatively early stage of consultation.",
    theme: "design_not_ready",
  },
  {
    question:
      "What specific safety measures will be in place for local residents?",
    question_timestamp_seconds: 3124,
    question_timestamp_display: "52:04",
    speaker: "John (Progressive Energy)",
    answer:
      "The pipeline will be designed according to the same standards that are used for high pressure gas networks.",
    theme: "safety_evasion",
  },
  {
    question: "How close will the pipeline be to residential properties?",
    question_timestamp_seconds: 3223,
    question_timestamp_display: "53:43",
    speaker: "Jim Doyle (Consents Manager)",
    answer:
      "There are areas where we may be maybe a little closer, in areas where we are a little constrained.",
    theme: "proximity_to_homes",
  },
  {
    question:
      "What will the construction work look like as it goes through land, across pathways and roads?",
    question_timestamp_seconds: 3289,
    question_timestamp_display: "54:49",
    speaker: "John (Progressive Energy)",
    answer:
      "There\u2019s no kind of single answer. It\u2019s going to be each situation will be different. Clearly, if there are places where there are foot paths, we might have to temporarily close a foot path or a road.",
    theme: "construction_disruption",
  },
  {
    question:
      "There are still quite a lot of unanswered questions \u2014 when will we get answers?",
    question_timestamp_seconds: 3397,
    question_timestamp_display: "56:37",
    speaker: "John (Progressive Energy)",
    answer:
      "This is a first consultation. So there will be a good period of time to review all of that information ahead of the second consultation.",
    theme: "perpetual_deferral",
  },
  {
    question:
      "Will the pipeline have a capacity of 3 million tonnes per year, or will you build a bigger pipe for other industrial emitters?",
    question_timestamp_seconds: 3461,
    question_timestamp_display: "57:41",
    speaker: "John (Progressive Energy)",
    answer:
      "The pipeline will have capacity to carry more CO\u2082 than just the cement and lime producers. Some of the above ground installations are named as connection above ground installations because we\u2019re intentionally designing that in a way so that further pipelines could be connected.",
    theme: "pipeline_expansion",
  },
  {
    question:
      "Why is this pipeline taking a long and circuitous route through Cheshire rather than going further north?",
    question_timestamp_seconds: 4280,
    question_timestamp_display: "71:20",
    speaker: "John (Progressive Energy)",
    answer:
      "When you do that analysis it\u2019s surprising how few places are available, both because of existing development, housing and so on along the coast, the geography.",
    theme: "route_predetermined",
  },
  {
    question:
      "How much of the CO\u2082 emitted during cement and lime production will actually be captured?",
    question_timestamp_seconds: 4487,
    question_timestamp_display: "74:47",
    speaker: "John (Progressive Energy)",
    answer:
      "Each are looking at technologies that will capture between kind of typically 90 to 95% of the CO\u2082 that is currently emitted. Clearly you want to get as high as possible.",
    theme: "incomplete_capture",
  },
  {
    question:
      "Have there been any studies on the effect of CCS facilities on nearby house prices?",
    question_timestamp_seconds: 5224,
    question_timestamp_display: "87:04",
    speaker: "Charles (Land/Property)",
    answer:
      "Where there is a pipeline which is buried this would not normally affect any property prices. However it is where we have AGI facilities there is a potential for affecting house prices.",
    theme: "property_dismissal",
  },
];

const WEBINARS: Webinar[] = [
  {
    id: "wirral",
    videoId: "ZosercZyELI",
    label: "Wirral Webinar",
    date: "February 2026",
    quotes: WIRRAL_QUOTES,
  },
  {
    id: "cheshire",
    videoId: "Z0hZ0BOUSDM",
    label: "Cheshire Webinar",
    date: "February 2026",
    quotes: CHESHIRE_QUOTES,
  },
];

declare global {
  interface Window {
    YT: {
      Player: new (
        element: string | HTMLElement,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  destroy: () => void;
}

export default function WebinarPlayer() {
  const [activeWebinar, setActiveWebinar] = useState(0);
  const [activeQuote, setActiveQuote] = useState<number | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const apiReady = useRef(false);
  const currentVideoId = useRef(WEBINARS[0].videoId);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    globalThis.window.onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
      if (playerContainerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        playerRef.current = new (globalThis as any).YT.Player("yt-player", {
          videoId: WEBINARS[0].videoId,
          playerVars: { modestbranding: 1, rel: 0 },
          events: { onReady: () => setPlayerReady(true) },
        });
      }
    };

    const firstScript = document.querySelectorAll("script")[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);

    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!playerRef.current) return;

      const webinar = WEBINARS[activeWebinar];
      if (currentVideoId.current === webinar.videoId) {
        playerRef.current.seekTo(seconds, true);
        playerRef.current.playVideo();
      } else {
        playerRef.current.loadVideoById(webinar.videoId, seconds);
        currentVideoId.current = webinar.videoId;
      }

      playerContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    },
    [activeWebinar],
  );

  const handleQuoteClick = useCallback(
    (index: number, seconds: number) => {
      setActiveQuote(index);
      seekTo(seconds);
    },
    [seekTo],
  );

  const handleTabSwitch = useCallback((index: number) => {
    setActiveWebinar(index);
    setActiveQuote(null);
    const webinar = WEBINARS[index];
    if (playerRef.current && currentVideoId.current !== webinar.videoId) {
      playerRef.current.loadVideoById(webinar.videoId);
      currentVideoId.current = webinar.videoId;
    }
  }, []);

  const webinar = WEBINARS[activeWebinar];

  return (
    <div className="space-y-6">
      {/* Video tabs */}
      <div className="flex gap-2">
        {WEBINARS.map((w, index) => (
          <button
            key={w.id}
            onClick={() => handleTabSwitch(index)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              index === activeWebinar
                ? "bg-[#FFD700] text-black"
                : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Video player */}
      <div ref={playerContainerRef}>
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
          {!playerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 animate-pulse">
              <svg
                className="w-12 h-12 text-white/20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
          <div id="yt-player" className="w-full h-full" />
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Source: Peak Cluster {webinar.label}, {webinar.date}. Click any
          Q&amp;A below to jump to that moment in the video.
        </p>
      </div>

      {/* Quotes */}
      <p className="text-gray-600 text-xs italic">
        Theme labels are our editorial interpretation. Watch the full recording
        above to judge the context for yourself.
      </p>
      <div className="space-y-4">
        {webinar.quotes.map((q, index) => {
          const themeInfo = THEME_LABELS[q.theme] || {
            label: q.theme,
            color: "text-gray-400",
          };
          return (
            <button
              key={`${webinar.id}-${q.question_timestamp_seconds}-${index}`}
              onClick={() =>
                handleQuoteClick(index, q.question_timestamp_seconds)
              }
              className={`w-full text-left border-l-2 pl-4 py-3 transition-all cursor-pointer rounded-r-lg ${
                activeQuote === index
                  ? "border-[#FFD700] bg-[#FFD700]/10"
                  : "border-white/20 hover:border-[#FFD700]/60 hover:bg-white/8"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-[#FFD700] font-mono text-xs whitespace-nowrap mt-1 shrink-0">
                  {q.question_timestamp_display}
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  {/* The question */}
                  <p className="text-gray-300 text-sm font-medium">
                    <span className="text-gray-500">Q:</span> {q.question}
                  </p>
                  {/* The answer */}
                  <p className="text-white italic leading-relaxed">
                    &ldquo;{q.answer}&rdquo;
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500 text-xs">
                      &mdash; {q.speaker}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/8 ${themeInfo.color}`}
                    >
                      {themeInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
