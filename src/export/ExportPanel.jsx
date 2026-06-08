import NumberField from '../components/NumberField.jsx'
import BgToggle from '../components/BgToggle.jsx'
import LoopTimeline from '../components/LoopTimeline.jsx'
import '../styles/export.css'

function PhotoCount({ count }) {
  const text = count === 0
    ? 'No photos · drop images to begin'
    : `${count} photo${count !== 1 ? 's' : ''} loaded`
  return <p className="ep-photo-count">{text}</p>
}

export default function ExportPanel({
  presetId,
  bgColor, onBgChange,
  controls, onControlsChange,
  photoCount = 0,
  exportFormat,
  loopS, onLoopChange,
}) {
  function setCtrl(key, val) {
    onControlsChange({ ...controls, [key]: val })
  }

  const isLandscape      = presetId === 'landscape'
  const isShuffle    = presetId === 'shuffle'
  const isMainStage  = presetId === 'mainStage'
  const isSpiral     = presetId === 'spiral'
  const isPhotoBooth = presetId === 'photoBooth'
  const isCube       = presetId === 'cube'
  const is2D         = isShuffle || isMainStage || isSpiral || isPhotoBooth

  const showComposition = !isPhotoBooth && !isCube

  return (
    <div>
      {/* Photo count */}
      <PhotoCount count={photoCount} />

      {/* Format hints (non-scape only) */}
      {!isLandscape && isMainStage && exportFormat !== 'portrait' && (
        <p className="ep-photo-count" style={{ color: 'rgba(240,180,80,0.7)' }}>
          Best with Portrait (9:16) format
        </p>
      )}
      {!isLandscape && isSpiral && exportFormat !== 'square' && (
        <p className="ep-photo-count" style={{ color: 'rgba(240,180,80,0.7)' }}>
          Spiral is designed for 1:1 square format
        </p>
      )}
      {!isLandscape && isPhotoBooth && exportFormat === 'landscape' && (
        <p className="ep-photo-count" style={{ color: 'rgba(240,180,80,0.7)' }}>
          Best with Square or Portrait format
        </p>
      )}

      {/* Background */}
      <div style={{ marginBottom: 4 }}>
        <BgToggle bgColor={bgColor} onBgChange={onBgChange} />
      </div>

      {/* Composition */}
      {showComposition && (
        <>
          <h3 className="ep-section">Composition</h3>
          <div className="ep-panel">
            {!is2D && !isLandscape && (
              <NumberField label="Count"  value={controls.count}  min={1}   max={100} step={1}    onChange={v => setCtrl('count', v)} />
            )}
            {!is2D && !isLandscape && (
              <NumberField label="Zoom"   value={controls.zoom}   min={0.4} max={3}   step={0.05} onChange={v => setCtrl('zoom', v)} />
            )}
            {!is2D && !isLandscape && presetId !== 'flow' && (
              <NumberField label="Radius" value={controls.radius} min={0.3} max={3}   step={0.05} onChange={v => setCtrl('radius', v)} />
            )}
            {!is2D && !isLandscape && (
              <NumberField label="Scale"  value={controls.scale}  min={0.2} max={2}   step={0.05} onChange={v => setCtrl('scale', v)} />
            )}
            {!isMainStage && !isSpiral && (
              <NumberField label="Corners" value={controls.corners ?? 0} min={0} max={0.5} step={0.01} onChange={v => setCtrl('corners', v)} />
            )}
            <NumberField
              label="Speed"
              value={controls.speed}
              min={0.1}
              max={3.0}
              step={0.05}
              onChange={v => setCtrl('speed', v)}
            />
          </div>
        </>
      )}
      {/* Video Length — non-scape only */}
      {!isLandscape && (
        <>
          <h3 className="ep-section">Video Length</h3>
          <div className="ep-panel">
            <NumberField label="Loop" value={loopS} min={1} max={24} step={0.1} onChange={onLoopChange} unit=" s" />
            <LoopTimeline loopS={loopS} />
          </div>
        </>
      )}
    </div>
  )
}
