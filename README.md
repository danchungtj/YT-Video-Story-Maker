# Story Voice Converter

A beautiful, client-side web application that converts written text into high-quality voice narrations using browser APIs. No backend required!

![Story Voice Converter](https://img.shields.io/badge/React-19.0.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue) ![Vite](https://img.shields.io/badge/Vite-6.2.0-purple) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-teal)

## ✨ Features

- 🎙️ **Text-to-Speech Conversion** - Convert stories up to 100,000 characters
- 🗣️ **Voice Selection** - Choose from available English and Chinese voices
- ⚡ **Speech Rate Control** - Adjust playback speed from 0.5x to 2x
- 🎵 **Audio Export** - Download as WAV or WebM files
- 🔊 **High-Quality Recording** - Virtual Cable integration for perfect audio capture
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Beautiful UI** - Modern gradient design with particle effects
- 📊 **Real-time Stats** - Word and character counting
- 🎧 **Audio Preview** - Built-in player for generated files

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd story-voice-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - The app will automatically open at `http://localhost:5173`
   - If it doesn't open automatically, navigate to the URL shown in your terminal

## 🎯 How to Use

### Basic Usage

1. **Enter your content**
   - Add an optional story title
   - Paste or type your story content (up to 100,000 characters)

2. **Configure voice settings**
   - Select your preferred voice from the dropdown
   - Adjust speech rate using the slider (0.5x - 2x speed)
   - Choose export format (WAV recommended)

3. **Preview your audio**
   - Click "Preview & Play" to hear how it sounds
   - Use "Stop Playing" to halt playback

4. **Export high-quality audio**
   - Click "Export High-Quality Audio"
   - Follow the Virtual Cable setup instructions for best results

### 🔧 For Perfect Audio Quality (Recommended)

**Install VB-Audio Virtual Cable:**

1. Download [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) (free)
2. Install the software and restart your computer
3. Go to Windows Sound Settings:
   - Set **"CABLE Input"** as your default **Output** device
   - Set **"CABLE Output"** as your default **Input** device
4. When exporting audio, click "I enabled Virtual Cable"

**Why Virtual Cable?**
- Zero audio quality loss
- No background noise or echo
- Perfect internal audio routing
- Professional-grade results

## 📁 Project Structure

```
story-voice-converter/
├── src/
│   ├── App.tsx              # Main application component
│   ├── index.css            # Global styles and animations
│   ├── main.tsx             # Application entry point
│   └── lib/
│       └── utils.ts         # Utility functions
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # TailwindCSS configuration
├── vite.config.ts          # Vite configuration
├── README.md               # This file
└── PRD.md                  # Product Requirements Document
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript and ESLint checks

## 🌐 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Speech Synthesis | ✅ | ✅ | ✅ | ✅ |
| Audio Recording | ✅ | ✅ | ✅ | ✅ |
| WAV Export | ✅ | ✅ | ✅ | ✅ |
| Virtual Cable | ✅ | ✅ | ⚠️ | ✅ |

⚠️ Safari has limited Virtual Cable support

## 🔧 Technical Details

### Core Technologies

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Sonner** - Beautiful toast notifications

### Browser APIs Used

- **Speech Synthesis API** - Text-to-speech conversion
- **MediaRecorder API** - Audio recording and export
- **Web Audio API** - Audio processing and WAV conversion
- **File API** - Audio file downloads

### Key Features Implementation

- **Voice Loading** - Dynamic voice detection with language filtering
- **Audio Export** - WebM to WAV conversion using AudioContext
- **File Naming** - Smart naming based on title and date
- **Responsive Design** - Mobile-first approach with Tailwind
- **Error Handling** - Comprehensive error messages and fallbacks

## 🎨 Customization

### Styling
- Modify `src/index.css` for global styles
- Update `tailwind.config.js` for theme customization
- Particle effects can be adjusted in `App.tsx`

### Voice Filters
- Edit the voice filter in `App.tsx` to support more languages:
```typescript
const filteredVoices = availableVoices.filter(voice => 
  voice.lang.startsWith('en') || 
  voice.lang.startsWith('zh') ||
  voice.lang.startsWith('fr') // Add French
);
```

### Audio Settings
- Modify audio recording parameters in `handleExportWithVirtualCable`
- Adjust WAV conversion settings in `createWavFile`

## 🐛 Troubleshooting

### Common Issues

**No voices available:**
- Refresh the page
- Check browser speech synthesis support
- Try a different browser

**Audio export not working:**
- Allow microphone permissions
- Check Virtual Cable installation
- Ensure proper audio device settings

**Silent audio files:**
- Verify Virtual Cable setup
- Check Windows sound settings
- Ensure CABLE devices are set as default

**Performance issues with long text:**
- Break content into smaller chunks
- Use faster speech rates
- Close other browser tabs

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure your browser supports the required APIs
3. Verify Virtual Cable installation for audio export
4. Open an issue with detailed error information

---

**Enjoy converting your stories to voice! 🎉**
