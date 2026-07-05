export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { ConsoleSpanExporter } = await import('@opentelemetry/sdk-trace-node');

    const sdk = new NodeSDK({
      serviceName: 'pitchautopsy-frontend',
      traceExporter: new ConsoleSpanExporter(),
    });

    sdk.start();
    console.log('[OpenTelemetry] Frontend instrumentation initialized successfully.');
  }
}
