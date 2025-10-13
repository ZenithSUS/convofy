import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

interface Props {
  editMessage: {
    id: string;
    content: string;
  };

  onEditMessage: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
}

function MessageEdit({ editMessage, onEditMessage, onCancelEdit }: Props) {
  const editForm = useForm({
    defaultValues: {
      content: editMessage.content,
    },
  });

  const watchedContent = useWatch({
    control: editForm.control,
    name: "content",
  });

  const isMessageChanged = useMemo(() => {
    return editMessage.content !== watchedContent;
  }, [editMessage.content, watchedContent]);

  const onSubmit = (data: { content: string }) => {
    onEditMessage(editMessage.id, data.content);
  };

  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onSubmit)}>
        <FormField
          control={editForm.control}
          name="content"
          render={({ field }) => (
            <Textarea
              placeholder="Edit Message"
              className="border-input/50 dark:bg-input/30 w-full max-w-sm border-2"
              maxLength={1000}
              {...field}
            />
          )}
        />

        <div className="flex w-full items-center justify-center gap-2 p-2">
          <Button
            type="submit"
            size="icon"
            className="flex-1 cursor-pointer px-2 py-1 disabled:opacity-50"
            disabled={!isMessageChanged}
          >
            <Check className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="flex-1 cursor-pointer px-2 py-1"
            size="icon"
            onClick={onCancelEdit}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default MessageEdit;
