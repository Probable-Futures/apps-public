import { makeWrapResolversPlugin } from "graphile-utils";

import { sendSlackNotification } from "../services/slack-notfier";
import { createAudit } from "../services/audit";
import { isProd } from "../utils/env";
import mbxGeocode from "../services/geocode/geocode";
import { includeClimateZoneName } from "../services/graphql/dataset-statistics";

export const WrapReolversPlugin = makeWrapResolversPlugin({
  Mutation: {
    getDatasetStatistics: {
      async resolve(resolve: any, _source, args, context: any, _resolveInfo) {
        const { pgClient } = context;
        try {
          if (isProd && context.rateLimitThreshold > 80) {
            sendRateLimitWarning(context.rateLimitThreshold, context.userSub);
          }
          let argsInput = { ...args.input };
          const { longitude, latitude, country, city, address } = args.input;
          if ((!longitude || !latitude) && (country || address)) {
            const geocodeResult = await mbxGeocode({ country, city, address });
            if (geocodeResult) {
              argsInput = {
                ...argsInput,
                longitude: geocodeResult.long,
                latitude: geocodeResult.lat,
              };
            }
          }
          // Run the original resolver
          const result = await resolve(
            _source,
            { ...args, input: argsInput },
            context,
            _resolveInfo,
          );
          const finaleResult = includeClimateZoneName(result, pgClient);
          await createAudit(
            pgClient,
            "dataset_statistics",
            args.input,
            context.userIp,
            "success",
            context.rateLimitThreshold,
          );
          return finaleResult;
        } catch (error) {
          let message = "Error occurred";
          if (error instanceof Error) {
            message = error.message;
          }
          await createAudit(
            pgClient,
            "dataset_statistics",
            args.input,
            context.userIp,
            message,
            context.rateLimitThreshold,
          );
          throw error;
        }
      },
    },
  },
});

const sendRateLimitWarning = async (rateLimitThreshold: number, userSub: string) => {
  const message = `Warning: Too many requests sent by ${userSub}. RateLimit threshold = ${rateLimitThreshold}`;
  try {
    sendSlackNotification(message);
  } catch (e) {
    console.error(e);
  }
};
