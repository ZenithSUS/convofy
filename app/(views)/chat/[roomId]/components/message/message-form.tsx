"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import MediaUpload from "@/app/(views)/chat/[roomId]/components/message/media-upload";
import { Button } from "@/components/ui/button";

import EmojiSelection from "./emoji-selection";
import { Loader2, Send } from "lucide-react";
import { ChangeEvent, KeyboardEventHandler, useCallback, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";

interface MessageFormProps {
  messageForm: UseFormReturn<{ message: string }>;
  isSending: boolean;
  isUploading: boolean;
  isTypingIndicatorHidden?: boolean;
  isAllFetched?: boolean;
  handleSendMessage: (data: { message: string }) => void;
  handleTypingUser: () => void;
  handleStopTypingUser: () => void;
  handleEmojiAppend: (emoji: string) => void;
  handleAppendFile: (e: ChangeEvent<HTMLInputElement>) => void;
}

function MessageForm({
  messageForm,
  isSending,
  isUploading,
  isTypingIndicatorHidden,
  isAllFetched,
  handleSendMessage,
  handleTypingUser,
  handleStopTypingUser,
  handleEmojiAppend,
  handleAppendFile,
}: MessageFormProps) {
  const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      messageForm.handleSubmit(handleSendMessage)();
    }
  };

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      messageForm.setValue("message", e.target.value);
      if (isTypingIndicatorHidden) return;

      if (e.target.value.length > 0) {
        handleTypingUser();
      } else {
        handleStopTypingUser();
      }
    },
    [
      handleTypingUser,
      handleStopTypingUser,
      messageForm,
      isTypingIndicatorHidden,
    ],
  );

  const isAnyTransactionInProgress = useMemo(() => {
    return isSending || isUploading || !isAllFetched;
  }, [isSending, isUploading, isAllFetched]);

  return (
    <Form {...messageForm}>
      <form
        className="flex gap-2 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        onSubmit={messageForm.handleSubmit(handleSendMessage)}
      >
        <FormField
          control={messageForm.control}
          name="message"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="sr-only">Message</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={
                    isSending ? "Sending..." : "Type your message..."
                  }
                  className="max-h-32 min-h-12 resize-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-base dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:bg-gray-800 dark:focus:ring-blue-400"
                  disabled={isSending || isUploading || !isAllFetched}
                  onChange={(e) => handleChange(e)}
                  onBlur={() => handleStopTypingUser()}
                  onKeyDown={onKeyDown}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-end gap-2">
          <MediaUpload
            onChange={handleAppendFile}
            isUploading={isUploading}
            disabled={isAnyTransactionInProgress}
          />
          <EmojiSelection
            onEmojiAppend={handleEmojiAppend}
            disabled={isAnyTransactionInProgress}
          />
          <Button
            type="submit"
            className="h-12 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50 dark:bg-linear-to-r dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700"
            disabled={isAnyTransactionInProgress}
          >
            {isSending || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default MessageForm;
