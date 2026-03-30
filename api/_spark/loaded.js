/**
 * No-op endpoint that acknowledges the Spark runtime "loaded" telemetry event.
 */
export default function handler(req, res) {
  res.status(200).end();
}
