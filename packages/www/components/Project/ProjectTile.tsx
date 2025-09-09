import { Avatar } from "@livepeer/design-system";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Flex } from "components/ui/flex";
import { Text } from "components/ui/text";
import { getEmojiIcon } from "lib/get-emoji";
import { ArrowRightIcon } from "lucide-react";

function ProjectTile({ name, id, invalidateQuery }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Flex className="items-center justify-between">
          <Flex className="gap-2 items-center">
            <Avatar fallback={getEmojiIcon(name)} size={"3"} />
            <Text className="font-medium">{name}</Text>
          </Flex>
        </Flex>

        <Flex className="justify-end">
          <Button variant="outline" size="sm" className="mt-10">
            Open project <ArrowRightIcon className="ml-2 w-4 h-4" />
          </Button>
        </Flex>
      </CardContent>
    </Card>
  );
}

export default ProjectTile;
