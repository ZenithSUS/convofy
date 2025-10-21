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
import MediaUpload from "@/app/(views)/chat/components/media-upload";
import { Button } from "@/components/ui/button";
import EmojiSelection from "@/app/(views)/chat/components/emoji-selection";
import { Loader2, Send } from "lucide-react";
import { ChangeEvent } from "react";
import { UseFormReturn } from "react-hook-form";

interface MessageFormProps {
  messageForm: UseFormReturn<{ message: string }>;
  isSending: boolean;
  isUploading: boolean;
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
  handleSendMessage,
  handleTypingUser,
  handleStopTypingUser,
  handleEmojiAppend,
  handleAppendFile,
}: MessageFormProps) {
  return (
    <Form {...messageForm}>
      <form
        className="flex gap-2 p-4"
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
                  className="max-h-32 min-h-[48px] resize-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-400 focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-base"
                  disabled={isSending}
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value.length > 0) {
                      handleTypingUser();
                    } else {
                      handleStopTypingUser();
                    }
                  }}
                  onBlur={() => handleStopTypingUser()}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-end gap-2">
          <MediaUpload onChange={handleAppendFile} isUploading={isUploading} />
          <EmojiSelection onEmojiAppend={handleEmojiAppend} />
          <Button
            type="submit"
            className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white shadow-md transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:opacity-50"
            disabled={isSending || isUploading}
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
