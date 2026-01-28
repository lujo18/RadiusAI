import Beams from "../Beams"

const GridBeamBackground = () => {
  return (<div style={{ width: '1080px', height: '1080px', position: 'relative' }}>
  <Beams
    beamWidth={1.5}
    beamHeight={23}
    beamNumber={12}
    lightColor="#04b922"
    speed={2.5}
    noiseIntensity={2.25}
    scale={0.15}
    rotation={25}
  />
</div>)
}