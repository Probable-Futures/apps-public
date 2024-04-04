export const createAudit = async (
  pgClient: any,
  actionType: string,
  payload: any,
  userIp: string,
  message: string,
  rateLimitThreshold: number,
) => {
  try {
    await pgClient.query("select * from pf_public.create_audit ($1, $2, $3, $4, $5)", [
      actionType,
      payload,
      userIp,
      message,
      rateLimitThreshold,
    ]);
  } catch (error) {
    throw error;
  }
};
