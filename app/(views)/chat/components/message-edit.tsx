import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";
import { KeyboardEventHandler, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

interface Props {
  editMessage: {
    id: string;
    content: string;
  };

  onEditMessage: (messageId: string, content: string) => Promise<void>;
  onCancelEdit: () => void;
}

function MessageEdit({ editMessage, onEditMessage, onCancelEdit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    return (
      editMessage.content !== watchedContent && watchedContent.trim().length > 0
    );
  }, [editMessage.content, watchedContent]);

  const characterCount = useMemo(() => {
    return watchedContent?.length || 0;
  }, [watchedContent]);

  const onSubmit = async (data: { content: string }) => {
    if (!isMessageChanged) return;

    setIsSubmitting(true);
    try {
      await onEditMessage(editMessage.id, data.content);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      editForm.handleSubmit(onSubmit)();
    }
    if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  return (
    <div className="w-full">
      <Form {...editForm}>
        <form onSubmit={editForm.handleSubmit(onSubmit)} className="space-y-3">
          {/* Edit Header */}
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
              Editing Message
            </span>
            <span
              className={`text-xs font-medium ${
                characterCount > 900
                  ? "text-red-600"
                  : characterCount > 800
                    ? "text-orange-600"
                    : "text-gray-500"
              }`}
            >
              {characterCount}/1000
            </span>
          </div>

          {/* Textarea */}
          <FormField
            control={editForm.control}
            name="content"
            render={({ field }) => (
              <Textarea
                placeholder="Edit your message..."
                className="max-h-[200px] min-h-[80px] w-full resize-none rounded-xl border-2 border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-black transition-all focus:border-blue-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-200 dark:text-white"
                maxLength={1000}
                disabled={isSubmitting}
                onKeyDown={onKeyDown}
                {...field}
              />
            )}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-green-600 font-semibold text-white shadow-sm transition-all duration-200 hover:from-green-600 hover:to-green-700 hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50"
              disabled={!isMessageChanged || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 rounded-lg border-2 border-gray-300 font-semibold text-gray-600 transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          {/* Helper Text */}
          {!isMessageChanged && watchedContent.trim().length > 0 && (
            <p className="text-center text-xs text-gray-300 italic">
              No changes made
            </p>
          )}
          {watchedContent.trim().length === 0 && (
            <p className="text-center text-xs text-red-500">
              Message cannot be empty
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}

export default MessageEdit;
