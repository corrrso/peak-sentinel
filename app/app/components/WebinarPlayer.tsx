"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Quote = {
  question: string;
  question_timestamp_seconds: number;
  question_timestamp_display: string;
  speaker: string;
  answer: string;
};

type Webinar = {
  id: string;
  videoId: string;
  label: string;
  date: string;
  quotes: Quote[];
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

  },
  {
    question:
      "The 1,500 jobs figure \u2014 will those be local jobs for Wirral residents?",
    question_timestamp_seconds: 3728,
    question_timestamp_display: "62:08",
    speaker: "John (Progressive Energy)",
    answer:
      "Clearly construction of pipelines, construction of carbon capture facilities, those will be with specialist contractors.",

  },
  {
    question:
      "How often will it be necessary to vent CO\u2082? What evidence do you have on the impact on humans and local wildlife?",
    question_timestamp_seconds: 4597,
    question_timestamp_display: "76:37",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer:
      "I don\u2019t think I can answer all your questions in the level of detail that I suspect you\u2019d like because we are still doing the design.",

  },
  {
    question:
      "What volumes of CO\u2082 would be released during venting near residential areas?",
    question_timestamp_seconds: 4597,
    question_timestamp_display: "76:37",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer:
      "We don\u2019t have precise numbers on the amount of CO\u2082 that would be vented because we haven\u2019t completed the design.",

  },
  {
    question:
      "Can you say more about the dispersions analysis and its findings?",
    question_timestamp_seconds: 4597,
    question_timestamp_display: "76:37",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer:
      "I don\u2019t think I can say that much more on it at the moment because we are undertaking our studies. We\u2019re doing dispersions analysis to confirm the design.",

  },
  {
    question: "How would you inform residents in case of an emergency?",
    question_timestamp_seconds: 4631,
    question_timestamp_display: "77:11",
    speaker: "John (Progressive Energy)",
    answer: "I think we\u2019re probably a little early for that.",

  },
  {
    question:
      "So there\u2019s no emergency notification plan for Wirral residents?",
    question_timestamp_seconds: 4631,
    question_timestamp_display: "77:11",
    speaker: "Susan McKenzie (Spirit Energy)",
    answer: "Yeah, we are a little early for that.",

  },
  {
    question:
      "What specific biodiversity improvements are planned for the Wirral?",
    question_timestamp_seconds: 4936,
    question_timestamp_display: "82:16",
    speaker: "Chris Taylor (Peak Cluster)",
    answer:
      "The short answer to this is we don\u2019t yet know because we don\u2019t know exactly where the pipeline will go and we don\u2019t know exactly what impacts we will have.",

  },
  {
    question:
      "What will happen if landowners don\u2019t permit access to the land?",
    question_timestamp_seconds: 3900,
    question_timestamp_display: "65:00",
    speaker: "Charles (Land/Property)",
    answer:
      "We will be seeking our compulsory purchase powers. And I would stress that is an absolute fallback for the project. We do not want to have to use them but it is something which we need to seek.",

  },
  {
    question: "Can you force entry onto private land even before construction?",
    question_timestamp_seconds: 3900,
    question_timestamp_display: "65:00",
    speaker: "Charles (Land/Property)",
    answer:
      "We do have powers available to us\u2026 to serve notice under the Housing and Planning Act to enter onto the land to undertake those surveys.",

  },
  {
    question: "How would house prices be affected?",
    question_timestamp_seconds: 3917,
    question_timestamp_display: "65:17",
    speaker: "Charles (Land/Property)",
    answer:
      "Having a pipeline located to a property does not materially impact the value of the property\u2026 and there is no study which shows that. However, where there are above ground installations, there could potentially be an impact.",

  },
  {
    question: "Why is the EIA funded by Peak Cluster \u2014 is it independent?",
    question_timestamp_seconds: 3293,
    question_timestamp_display: "54:53",
    speaker: "Mike (EIA/ARUP-AECOM)",
    answer:
      "Obviously, you know, up front we are paid by Peak Cluster to do the work.",

  },
  {
    question:
      "Could Peak Cluster connect to the existing HyNet system instead of building a new pipeline through the Wirral?",
    question_timestamp_seconds: 2860,
    question_timestamp_display: "47:40",
    speaker: "Chris Taylor (Peak Cluster)",
    answer:
      "That HyNet system, all the capacity in that is already allocated. So that\u2019s not an option for the CO\u2082 from there. So it does need to be a new pipeline system.",

  },
  {
    question:
      "What guarantees does Peak Cluster give to assure the public the disposal of CO\u2082 will be permanent?",
    question_timestamp_seconds: 5240,
    question_timestamp_display: "87:20",
    speaker: "John (Progressive Energy)",
    answer:
      "I recognise there are probably questions in there that we haven\u2019t\u2026 we\u2019ve tried to group them. So I hope we\u2019ve covered, even if it wasn\u2019t precisely your question.",

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

  },
  {
    question:
      "What are the impacts on the community \u2014 noise, land purchase, traffic management?",
    question_timestamp_seconds: 2785,
    question_timestamp_display: "46:25",
    speaker: "Jim Doyle (Consents Manager)",
    answer:
      "We will undertake baseline surveys. So we need to understand what the environment is like now. What\u2019s the ambient noise level? What sort of protected species are there?",

  },
  {
    question: "What about compulsory purchase?",
    question_timestamp_seconds: 3023,
    question_timestamp_display: "50:23",
    speaker: "Charles (Land/Property)",
    answer:
      "The project will be seeking its compulsory purchase powers under the development consent order, and we have to let everyone know that.",

  },
  {
    question: "What size will the AGI be?",
    question_timestamp_seconds: 3095,
    question_timestamp_display: "51:35",
    speaker: "John (Progressive Energy)",
    answer:
      "Clearly we\u2019ve not done the detail design because this is a relatively early stage of consultation.",

  },
  {
    question:
      "What specific safety measures will be in place for local residents?",
    question_timestamp_seconds: 3124,
    question_timestamp_display: "52:04",
    speaker: "John (Progressive Energy)",
    answer:
      "The pipeline will be designed according to the same standards that are used for high pressure gas networks.",

  },
  {
    question: "How close will the pipeline be to residential properties?",
    question_timestamp_seconds: 3223,
    question_timestamp_display: "53:43",
    speaker: "Jim Doyle (Consents Manager)",
    answer:
      "There are areas where we may be maybe a little closer, in areas where we are a little constrained.",

  },
  {
    question:
      "What will the construction work look like as it goes through land, across pathways and roads?",
    question_timestamp_seconds: 3289,
    question_timestamp_display: "54:49",
    speaker: "John (Progressive Energy)",
    answer:
      "There\u2019s no kind of single answer. It\u2019s going to be each situation will be different. Clearly, if there are places where there are foot paths, we might have to temporarily close a foot path or a road.",

  },
  {
    question:
      "There are still quite a lot of unanswered questions \u2014 when will we get answers?",
    question_timestamp_seconds: 3397,
    question_timestamp_display: "56:37",
    speaker: "John (Progressive Energy)",
    answer:
      "This is a first consultation. So there will be a good period of time to review all of that information ahead of the second consultation.",

  },
  {
    question:
      "Will the pipeline have a capacity of 3 million tonnes per year, or will you build a bigger pipe for other industrial emitters?",
    question_timestamp_seconds: 3461,
    question_timestamp_display: "57:41",
    speaker: "John (Progressive Energy)",
    answer:
      "The pipeline will have capacity to carry more CO\u2082 than just the cement and lime producers. Some of the above ground installations are named as connection above ground installations because we\u2019re intentionally designing that in a way so that further pipelines could be connected.",

  },
  {
    question:
      "Why is this pipeline taking a long and circuitous route through Cheshire rather than going further north?",
    question_timestamp_seconds: 4280,
    question_timestamp_display: "71:20",
    speaker: "John (Progressive Energy)",
    answer:
      "When you do that analysis it\u2019s surprising how few places are available, both because of existing development, housing and so on along the coast, the geography.",

  },
  {
    question:
      "How much of the CO\u2082 emitted during cement and lime production will actually be captured?",
    question_timestamp_seconds: 4487,
    question_timestamp_display: "74:47",
    speaker: "John (Progressive Energy)",
    answer:
      "Each are looking at technologies that will capture between kind of typically 90 to 95% of the CO\u2082 that is currently emitted. Clearly you want to get as high as possible.",

  },
  {
    question:
      "Have there been any studies on the effect of CCS facilities on nearby house prices?",
    question_timestamp_seconds: 5224,
    question_timestamp_display: "87:04",
    speaker: "Charles (Land/Property)",
    answer:
      "Where there is a pipeline which is buried this would not normally affect any property prices. However it is where we have AGI facilities there is a potential for affecting house prices.",

  },
];

const WIRRAL_ADDITIONAL_1_QUOTES: Quote[] = [
  {
    question:
      "When will the environmental impact assessment detail and baseline survey findings be available?",
    question_timestamp_seconds: 3240,
    question_timestamp_display: "54:00",
    speaker: "Chris (EIA)",
    answer:
      "That work is ongoing now. We\u2019ve been out doing surveys for a number of months. The first sort of publication of the findings of the surveys will be a little bit later this year in our preliminary environmental information that\u2019ll come out for our phase 2 consultation.",

  },
  {
    question:
      "Are you presenting the worst case scenario for the environmental impact?",
    question_timestamp_seconds: 3437,
    question_timestamp_display: "57:17",
    speaker: "Chris (EIA)",
    answer:
      "Sometimes in that application there\u2019s a little bit of flexibility required or maybe some different options that allow us to continue detailed design after that application has been made.",

  },
  {
    question:
      "What will be the impact on local businesses during construction?",
    question_timestamp_seconds: 3698,
    question_timestamp_display: "61:38",
    speaker: "Chris (EIA)",
    answer:
      "There will be a lot of work that\u2019s still to come in terms of minimising disruption during construction. There will be very detailed plans put in place, agreed with the local authority, that would control and manage construction traffic and impacts on that.",

  },
  {
    question:
      "What compensation will there be for local harm caused by the pipeline?",
    question_timestamp_seconds: 3862,
    question_timestamp_display: "64:22",
    speaker: "Charles Davenport (Lands Team)",
    answer:
      "Not all of the properties in the area will be directly affected. Where no land is affected directly, there are possible adverse impacts which may affect ownerships and values, and therefore that\u2019s dealt with through the compensation code, which is a statutory mechanism to allow eligible property owners to seek compensation for those losses in value.",

  },
  {
    question:
      "Is information being withheld or presented in a misleading way?",
    question_timestamp_seconds: 4050,
    question_timestamp_display: "67:30",
    speaker: "Rob (Peak Cluster)",
    answer:
      "Going out early does mean that we are in an earlier stage of our engineering development, an earlier stage of our environmental surveys and all the other various aspects. So that necessarily means we have a lower level of detail.",

  },
  {
    question: "Is this project already a done deal?",
    question_timestamp_seconds: 4153,
    question_timestamp_display: "69:13",
    speaker: "Rob (Peak Cluster)",
    answer:
      "We obviously as a promoter and an applicant believe that this is an important project in terms of the future of cement and lime industry in the UK and decarbonization of those industries. We will make that case, but we will have to show how we\u2019ve sought to reduce impacts, why we\u2019ve decided on the routes that we have for our pipeline.",

  },
  {
    question:
      "What are the long-term implications of high pressure CO\u2082 being stored under the sea? Fracking was considered safe until earthquakes were identified nearby.",
    question_timestamp_seconds: 4422,
    question_timestamp_display: "73:42",
    speaker: "Susan (Morham Net Zero)",
    answer:
      "I am not an expert in fracking so I\u2019m going to have to just leave that one and not make reference to it.",

  },
  {
    question:
      "What\u2019s being done to minimise noise and light pollution from the coastal AGI, which appears close to residential areas?",
    question_timestamp_seconds: 4578,
    question_timestamp_display: "76:18",
    speaker: "John Nicholson (Morham Net Zero)",
    answer:
      "The layout that we\u2019ve come up with, which was shown indicatively earlier, is the largest that we expect it would ever get to. Within that boundary of 300 by 180 is included any possible future expansion.",

  },
  {
    question:
      "What are the response times for pipeline leaks and CO\u2082 escape?",
    question_timestamp_seconds: 4710,
    question_timestamp_display: "78:30",
    speaker: "Rob (Peak Cluster)",
    answer:
      "We will be undertaking those ongoing studies as we move through this year, building on the work we\u2019ve already done, to undertake a detailed safety case to be able to demonstrate how safe it is to operate and how we will deal with leaks effectively in the very unlikely event that they were to occur.",

  },
  {
    question:
      "How will you return land to the same or better condition when the route goes through areas of old woodland?",
    question_timestamp_seconds: 4838,
    question_timestamp_display: "80:38",
    speaker: "Chris (EIA)",
    answer:
      "It is highly unlikely that we could get through 200 km of construction without removing a single tree. There will certainly be things like hedgerows that we will need to remove and reinstate.",

  },
  {
    question:
      "If the pipeline runs through green belt or farmland, does this mean the land cannot be built on?",
    question_timestamp_seconds: 5043,
    question_timestamp_display: "84:03",
    speaker: "Rob (Peak Cluster)",
    answer:
      "It does mean it will be substantially restricted in terms of what can be built upon it. For example, it wouldn\u2019t be possible to put houses, farm buildings or other structures on top of the pipeline route.",

  },
  {
    question:
      "Is there a plan to take carbon dioxide from elsewhere in the country and plug it into this pipeline?",
    question_timestamp_seconds: 5086,
    question_timestamp_display: "84:46",
    speaker: "Rob (Peak Cluster)",
    answer:
      "Government policy requires us to think about expansion. Pipelines can sometimes carry more gas even if they don\u2019t increase in size. So we\u2019re carefully considering what we know at the current time.",

  },
];

const WIRRAL_ADDITIONAL_2_QUOTES: Quote[] = [
  {
    question:
      "What safety measures are in place for emergency response plans and long-term guarantees to human safety?",
    question_timestamp_seconds: 2668,
    question_timestamp_display: "44:28",
    speaker: "Dave (Peak Cluster)",
    answer:
      "We haven\u2019t yet done the full safety case because we\u2019re clearly still designing the pipeline. We don\u2019t know its exact route.",
  },
  {
    question:
      "Is it safe to have the pipeline close to dense populations, hospitals, and critical services in one of the UK\u2019s most densely populated peninsulas?",
    question_timestamp_seconds: 2728,
    question_timestamp_display: "45:28",
    speaker: "Dave (Peak Cluster)",
    answer:
      "The answer to that is yes it is, but that is obviously subject to our safety assessment.",
  },
  {
    question:
      "How is the claim that Peak Cluster will produce low-carbon cement justified given the project will use CO\u2082 across its life cycle including decommissioning?",
    question_timestamp_seconds: 2766,
    question_timestamp_display: "46:06",
    speaker: "Dave (Peak Cluster)",
    answer:
      "We haven\u2019t yet done the calculation on that because we don\u2019t know the exact pipeline length.",
  },
  {
    question:
      "Will there be future expansion, enlargement, or additional connections beyond the first phase of development?",
    question_timestamp_seconds: 2917,
    question_timestamp_display: "48:37",
    speaker: "Dave (Peak Cluster)",
    answer:
      "A number of the AGIs along the pipeline route are designed for future connections from other carbon dioxide emitters in the region. They\u2019re not part of the baseline scheme.",
  },
  {
    question:
      "How will noise and light impact be assessed during construction?",
    question_timestamp_seconds: 3002,
    question_timestamp_display: "50:02",
    speaker: "Chris (EIA)",
    answer:
      "For some of those we would need to have some 24-hour working. So there might be a little bit of nighttime noise for a short period and we may need some safety lighting.",
  },
  {
    question:
      "How will the project benefit people, nature, and communities, not just industry?",
    question_timestamp_seconds: 3638,
    question_timestamp_display: "60:38",
    speaker: "Chris (EIA)",
    answer:
      "Very aware that elsewhere along the pipeline route, that\u2019s of less immediate benefit to people whilst it might be of benefit to UK PLC. Exactly what form that will take, we are still working on.",
  },
  {
    question:
      "What impact will the pipeline have on property values?",
    question_timestamp_seconds: 3950,
    question_timestamp_display: "65:50",
    speaker: "Charles Davenport (Lands Team)",
    answer:
      "The existence of the project does not automatically give rise to compensation, but we will consider all cases put to us.",
  },
  {
    question:
      "What tangible benefits, if any, will our population receive?",
    question_timestamp_seconds: 4068,
    question_timestamp_display: "67:48",
    speaker: "Chris (EIA)",
    answer:
      "This is something that we are working through at the moment as to exactly what form that will take. Whether that will be a dedicated community benefit fund or some other means of making a tangible difference to local communities.",
  },
  {
    question:
      "Why is this being decided nationally despite local opposition?",
    question_timestamp_seconds: 4192,
    question_timestamp_display: "69:52",
    speaker: "Dave (Peak Cluster)",
    answer:
      "We fully acknowledge that this is one of the main frustrations for every community along the pipeline route, the lack of local democracy in terms of this process. If every one of those had to secure the consent of the local community, then there\u2019s a very real possibility that very little infrastructure would get built across the UK.",
  },
  {
    question:
      "Has Spirit Energy managed a project like this before?",
    question_timestamp_seconds: 4306,
    question_timestamp_display: "71:46",
    speaker: "Susan (Morham Net Zero / Spirit Energy)",
    answer:
      "Spirit itself has not been in existence for long enough to deliver a project of this size, but Spirit in its former guises has done exactly that in the East Irish Sea.",
  },
  {
    question:
      "Can you provide details of all the AGIs on the Wirral, including basic sizes, operational hours, noise levels, vehicle movements, lighting, and security?",
    question_timestamp_seconds: 4652,
    question_timestamp_display: "77:32",
    speaker: "Dave (Peak Cluster)",
    answer:
      "Some of that we\u2019re not yet in a position to answer I\u2019m afraid. That\u2019s some of the engineering detail which we\u2019re working up over the next six months and will become available in our phase 2 consultation.",
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
  {
    id: "wirral-additional-1",
    videoId: "PObUN7BrEeM",
    label: "Wirral Additional 1",
    date: "April 2026",
    quotes: WIRRAL_ADDITIONAL_1_QUOTES,
  },
  {
    id: "wirral-additional-2",
    videoId: "d0MtVyHxTd4",
    label: "Wirral Additional 2",
    date: "April 2026",
    quotes: WIRRAL_ADDITIONAL_2_QUOTES,
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
      <div className="space-y-4">
        {webinar.quotes.map((q, index) => (
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
                  <p className="text-gray-300 text-sm font-medium">
                    <span className="text-gray-500">Q:</span> {q.question}
                  </p>
                  <p className="text-white italic leading-relaxed">
                    &ldquo;{q.answer}&rdquo;
                  </p>
                  <span className="text-gray-500 text-xs">
                    &mdash; {q.speaker}
                  </span>
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
