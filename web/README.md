## Anime Moto Video Studio

Anime Moto Video Studio is a Next.js application that generates anime-style cinematic videos of a young mechanic repairing a red motorcycle. Customize the prompt, pick an aspect ratio, and choose a clip duration before triggering the model.

### Prerequisites

- Node.js 18+
- A [Replicate](https://replicate.com) account with access to a text-to-video model (default: `luma-ai/dream-machine`)
- A valid `REPLICATE_API_TOKEN`

### Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Configure environment variables
   ```bash
   cp .env.example .env.local
   # edit .env.local with your Replicate token and optional model id
   ```
3. Run the development server
   ```bash
   npm run dev
   ```
4. Visit [http://localhost:3000](http://localhost:3000) and start generating videos.

### Deployment

The project is optimized for Vercel. Build and deploy with:

```bash
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-33bf698f
```

After deploying, verify the production URL:

```bash
curl https://agentic-33bf698f.vercel.app
```
