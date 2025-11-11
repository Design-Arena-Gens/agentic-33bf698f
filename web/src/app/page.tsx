"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

const DEFAULT_PROMPT =
  "Anime style young man fixing a red motorcycle in a sunny street, detailed background, consistent character design, cinematic lighting";

const aspectRatioOptions = [
  { value: "16:9", label: "Cinematic 16:9" },
  { value: "9:16", label: "Vertical 9:16" },
  { value: "1:1", label: "Square 1:1" },
  { value: "4:3", label: "Classic 4:3" },
];

const durationOptions = [
  { value: 4, label: "4s" },
  { value: 6, label: "6s" },
  { value: 8, label: "8s" },
  { value: 10, label: "10s" },
];

export default function Home() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  const hasHistory = promptHistory.length > 0;
  const recentPrompt = useMemo(() => promptHistory.at(0), [promptHistory]);
  const activePrompt = recentPrompt ?? prompt;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt before generating.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage("Sending request to the video model…");
    setVideoUrl(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "Video generation failed. Try updating your prompt or settings.";
        throw new Error(message);
      }

      const payload: {
        videoUrl?: string;
        prompt?: string;
        duration?: number;
        aspectRatio?: string;
      } = await response.json();

      if (!payload.videoUrl) {
        throw new Error(
          "The video service did not return a playable URL. Please try again."
        );
      }

      setVideoUrl(payload.videoUrl);
      setPromptHistory((previous) => {
        const normalized = payload.prompt ?? prompt;
        const updated = [
          normalized,
          ...previous.filter((item) => item !== normalized),
        ];
        return updated.slice(0, 8);
      });
      setStatusMessage("Video ready!");
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "Something went wrong. Please try again.";
      setError(message);
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <div>
            <p className={styles.tag}>AI VIDEO LAB</p>
            <h1>Anime Moto Video Studio</h1>
            <p className={styles.subtitle}>
              Generate cinematic anime scenes of a young mechanic repairing a
              red motorcycle. Tune the prompt and aspect ratio, then let the
              AI render your sequence.
            </p>
          </div>
        </header>

        <section className={styles.workspace}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="prompt">
              Prompt
            </label>
            <textarea
              id="prompt"
              name="prompt"
              className={styles.prompt}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={DEFAULT_PROMPT}
              rows={4}
              disabled={isLoading}
            />

            <div className={styles.controls}>
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Aspect Ratio</span>
                <div className={styles.controlButtons}>
                  {aspectRatioOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.controlButton} ${
                        aspectRatio === option.value ? styles.active : ""
                      }`}
                      onClick={() => setAspectRatio(option.value)}
                      disabled={isLoading}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Duration</span>
                <div className={styles.controlButtons}>
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.controlButton} ${
                        duration === option.value ? styles.active : ""
                      }`}
                      onClick={() => setDuration(option.value)}
                      disabled={isLoading}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.generateButton}
              disabled={isLoading}
            >
              {isLoading ? "Generating…" : "Generate Video"}
            </button>

            {statusMessage && (
              <p className={styles.status} role="status">
                {statusMessage}
              </p>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </form>

          <aside className={styles.output}>
            {videoUrl ? (
              <div className={styles.videoShell}>
                <video
                  key={videoUrl}
                  className={styles.video}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  src={videoUrl}
                />
                <div className={styles.videoMeta}>
                  <h2>Latest Render</h2>
                  <p>{activePrompt}</p>
                  <a
                    className={styles.downloadLink}
                    href={videoUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download video
                  </a>
                </div>
              </div>
            ) : (
              <div className={styles.placeholder}>
                <h2>No video yet</h2>
                <p>
                  Craft a vivid scene of the young mechanic and click generate
                  to watch the animation come to life.
                </p>
              </div>
            )}

            {hasHistory && (
              <div className={styles.history}>
                <h3>Recent prompts</h3>
                <ul>
                  {promptHistory.map((entry, index) => (
                    <li key={`${entry}-${index}`}>
                      <button
                        type="button"
                        onClick={() => setPrompt(entry)}
                        className={styles.historyButton}
                        disabled={isLoading}
                      >
                        {entry}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </section>
      </main>
      <footer className={styles.footer}>
        <p>
          Built for anime-style cinematic storytelling. Provide your own prompt
          variations or tweak the settings to steer the generator.
        </p>
      </footer>
    </div>
  );
}
