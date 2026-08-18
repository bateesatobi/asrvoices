import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom";
import Dashboard from "./views/Dashboard";
import LiveStream from "./views/Livestream";
import VideoStream from "./views/Videostream";
import Transcribe from "./views/Transcribe";
import History from "./views/History";
import Sidenav from "./components/Sidenav";
import { TourProvider } from "./components/onboarding";
import Translation from "./views/Translation";
import Text2Speech from "./views/Text2Speech";
import ViewVideo from "./views/ViewVideo";
import ViewAudio from "./views/ViewAudio";
import Voice2Voice from "./views/Voice2Voice";
import ViewttsAudio from "./views/ViewttsAudio";
import ViewTranslations from "./views/ViewTranslations";
import VoiceLingo from "./views/VoiceLingo";
import ViewAIVoice from "./views/ViewAIVoice";
import ViewVoxTrans from "./views/ViewVoxTrans";
import Summarization from "./views/Summarization";
import ViewSummary from "./views/ViewSummary";
import ViewChat from "./views/ViewChat";
import Home from "./views/Home";
import GetStarted from "./views/GetStarted";
import ContactSupport from "./views/ContactSupport";
import VoiceCloning from "./views/VoiceCloning";
import { AuthProvider,useAuth } from "./components/AuthContext";
import Pricing from "./views/Pricing";
import Subscription from "./views/Subscription";
import APIReference from "./views/APIReference";
import APis from "./views/APis";
import LanguageView from "./views/LangaugeView";
import ErrorBoundary from "./components/ErrorBoundary";
import LanguageSupport from "./views/LanguageSupport";
import ChatbotGuideView from "./views/ChatbotGuideView";
import ProfileView from "./views/ProfileView";
import UsageView from "./views/UsageView";
import Chatbot from "./components/Chatbot";
import UpgradePromptModal from "./components/UpgradePromptModal";
import GlobalSnackbar from "./components/GlobalSnackbar";
import GlobalProgressIndicator from "./components/GlobalProgressIndicator";
import BackgroundJobWatcher from "./components/BackgroundJobWatcher";
import DubbingView from "./views/DubbingView";
import VoiceoverView from "./views/VoiceoverView";
import DashboardHomeView from "./views/DashboardHomeView";
import VoicesView from "./views/VoicesView";
import SoundtracksView from "./views/SoundtracksView";
import ViewDubbing from "./views/ViewDubbing";
import ViewVoiceover from "./views/ViewVoiceover";
import RouteSEO from "./components/RouteSEO";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate replace to="/" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate replace to="/dashboard" /> : children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
        <RouteSEO />
        <Routes>
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/get-started" element={<PublicRoute><GetStarted /></PublicRoute>} />
          <Route path="/pricing" element={<PublicRoute><Pricing /></PublicRoute>} />
          <Route path="/documentation" element={<PublicRoute><APis /></PublicRoute>} />
          <Route path="/language-support" element={<PublicRoute><LanguageView /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><TourProvider><Sidenav /></TourProvider></PrivateRoute>}>
            <Route index element={<Navigate replace to="home" />} />
            <Route path="home" element={<ErrorBoundary><DashboardHomeView /></ErrorBoundary>} />
            <Route path="voices" element={<ErrorBoundary><VoicesView /></ErrorBoundary>} />
            <Route path="soundtracks" element={<ErrorBoundary><SoundtracksView /></ErrorBoundary>} />
            <Route path="agents" element={<ErrorBoundary><LiveStream /></ErrorBoundary>} />
            <Route path="conversational-ai" element={<ErrorBoundary><VideoStream /></ErrorBoundary>} />
            <Route path="usage" element={<ErrorBoundary><UsageView /></ErrorBoundary>} />
            <Route path="transcribe" element={<ErrorBoundary><Transcribe /></ErrorBoundary>} />
            <Route path="video-transcribe" element={<ErrorBoundary><VideoStream /></ErrorBoundary>} />
            <Route path="profile" element={<ErrorBoundary><ProfileView /></ErrorBoundary>} />
            <Route path="synthesize" element={<ErrorBoundary><Text2Speech /></ErrorBoundary>} />
            <Route path="summarize" element={<ErrorBoundary><Summarization /></ErrorBoundary>} />
            <Route path="translate" element={<ErrorBoundary><Translation /></ErrorBoundary>} />
            <Route path="voxtrans" element={<ErrorBoundary><VoiceLingo /></ErrorBoundary>} />
            <Route path="audio/:id" element={<ErrorBoundary><ViewAudio /></ErrorBoundary>} />
            <Route path="chats/:id" element={<ErrorBoundary><ViewChat /></ErrorBoundary>} />
            <Route path="aivoice/:id" element={<ErrorBoundary><ViewAIVoice /></ErrorBoundary>} />
            <Route path="voice/:id" element={<ErrorBoundary><ViewVoxTrans /></ErrorBoundary>} />
            <Route path="tts/:id" element={<ErrorBoundary><ViewttsAudio /></ErrorBoundary>} />
            <Route path="ttdata/:id" element={<ErrorBoundary><ViewTranslations /></ErrorBoundary>} />
            <Route path="summarydata/:id" element={<ErrorBoundary><ViewSummary /></ErrorBoundary>} />
            <Route path="video/:id" element={<ErrorBoundary><ViewVideo /></ErrorBoundary>} />
            <Route path="dub/:id" element={<ErrorBoundary><ViewDubbing /></ErrorBoundary>} />
            <Route path="voiceover/:id" element={<ErrorBoundary><ViewVoiceover /></ErrorBoundary>} />
            <Route path="voice" element={<ErrorBoundary><Voice2Voice /></ErrorBoundary>} />
            <Route path="chat-guide" element={<ErrorBoundary><ChatbotGuideView /></ErrorBoundary>} />
            <Route path="subscription" element={<ErrorBoundary><Subscription /></ErrorBoundary>} />
            <Route path="api-reference" element={<ErrorBoundary><APIReference /></ErrorBoundary>} />
            <Route path="lang-support" element={<ErrorBoundary><LanguageSupport /></ErrorBoundary>} />
            <Route path="contact-support" element={<ErrorBoundary><ContactSupport /></ErrorBoundary>} />
            <Route path="voice-cloning" element={<ErrorBoundary><VoiceCloning /></ErrorBoundary>} />
            <Route path="video-voiceover" element={<ErrorBoundary><DubbingView /></ErrorBoundary>} />
          </Route>
        </Routes>
        <GlobalProgressIndicator />
        <BackgroundJobWatcher />
        <GlobalSnackbar />
        {/* <Chatbot/> */}
        <UpgradePromptModal />
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;