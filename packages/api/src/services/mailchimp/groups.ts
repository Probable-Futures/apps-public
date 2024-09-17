import { mapKeys, snakeCase } from "lodash";
import { pick, camelCase } from "lodash";

import { GroupsResponse, Interest, InterestCategories } from "./mailchimp.types";
import { sendRequest } from "./request";
import { config } from "./config";

export async function getGroups(): Promise<GroupsResponse[]> {
  const groups: GroupsResponse[] = [];
  const interestCategories = await getInterestCategories();
  for (let i = 0; i < interestCategories.categories.length; i++) {
    const interestCategory = interestCategories.categories[i];
    const categoryInterests = await getInterestCategoryInterests(interestCategory.id);
    const mappedInterests = categoryInterests.interests.map((interest) => {
      const pickedInterest = pick(interest, ["id", "name", "display_order"]);
      const renamedInterest = mapKeys(pickedInterest, (_, key) =>
        camelCase(key),
      ) as unknown as Interest;
      return renamedInterest;
    });
    groups.push({
      groupId: interestCategory.id,
      groupTitle: interestCategory.title,
      displayOrder: interestCategory.display_order,
      type: interestCategory.type,
      interests: mappedInterests,
    });
  }
  return groups;
}

async function getInterestCategories(): Promise<InterestCategories> {
  const response = await sendRequest(`/lists/${config.contactListId}/interest-categories`, {
    method: "GET",
  });

  return response.json();
}

async function getInterestCategoryInterests(
  interestCategoryId: string,
): Promise<{ interests: Interest[] }> {
  const response = await sendRequest(
    `/lists/${config.contactListId}/interest-categories/${interestCategoryId}/interests`,
    {
      method: "GET",
    },
  );
  return response.json();
}
