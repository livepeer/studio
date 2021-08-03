import { useEffect, useState } from "react";
import SanityMuxPlayer from "sanity-mux-player";

const Player = ({ assetId }) => {
  const [document, setDocument] = useState(null);
  useEffect(() => {
    async function init() {
      const response = await fetch(
        `https://dp4k3mpw.api.sanity.io/v1/data/doc/production/${assetId}`
      );
      const { documents } = await response.json();
      setDocument(documents[0]);
    }
    init();
  }, []);

  return (
    <SanityMuxPlayer
      assetDocument={document}
      autoload={true}
      autoplay={false}
      showControls={true}
      muted={false}
      loop={false}
    />
  );
};

export default Player;
