import { TagsResponse, Tag } from "./mailchimp.types";
import { sendRequest } from "./request";
import { config } from "./config";
import { subscriberHash } from "./member";

export async function attachTagToMemeber(emailAddress: string, tagsPayload: { tags: Tag[] }) {
  await sendRequest(`/lists/${config.contactListId}/members/${subscriberHash(emailAddress)}/tags`, {
    method: "POST",
    body: JSON.stringify(tagsPayload),
  });
}

export async function getTags(): Promise<TagsResponse[]> {
  try {
    const response = await sendRequest(`/lists/${config.contactListId}/tag-search`, {
      method: "GET",
    });

    const data = await response.json();

    return data.tags;
  } catch (error) {
    console.error("Error listing tags:", error);
    throw error;
  }
}
