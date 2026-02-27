export function getAudioConstraints(): MediaStreamConstraints {
  return {
    audio: {
      sampleRate: 16000,
      sampleSize: 16,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  }
}

export function createMediaRecorder(stream: MediaStream): MediaRecorder {
  const mimeType = getSupportedMimeType()
  return new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128_000 })
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function createAudioAnalyser(stream: MediaStream): {
  analyser: AnalyserNode
  dataArray: Uint8Array
} {
  const ctx = new AudioContext()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  return { analyser, dataArray }
}

export function getFrequencyData(analyser: AnalyserNode, dataArray: Uint8Array): Uint8Array {
  analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>)
  return dataArray
}
