import {ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {chatService} from '../../services/websocket.service';
import {DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IChatMessage} from '../../models/message.model';
import {HttpClientModule} from '@angular/common/http';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    NgClass,
    DatePipe,
    NgIf,
    HttpClientModule
  ],
  providers: [chatService],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent implements OnInit {
  @ViewChild('messageList') messageList!: ElementRef;

  messages: IChatMessage[] = [];
  messageContent = '';
  username = 'User' + Math.floor(Math.random() * 1000);

  constructor(
    private chatService: chatService,
    private cdr: ChangeDetectorRef
  ) {
  }

  private scrollToBottom() {
    try {
      this.messageList.nativeElement.scrollTop = this.messageList.nativeElement.scrollHeight;
    } catch (err) {
      console.error("Scroll to bottom failed: ", err);
    }
  }

  ngOnInit() {
    this.chatService.connect(
      (messages: IChatMessage[] | IChatMessage) => {
        if (Array.isArray(messages)) {
          this.messages = messages.map(message => ({
            ...message,
            createdAt: new Date(message.createdAt),
            content:
              message.type === 'JOIN' && !message.content
                ? `${message.sender} joined the chat`
                : message.type === 'LEAVE' && !message.content
                  ? `${message.sender} left the chat`
                  : message.content
          }));
        } else {
          if (messages.type === 'JOIN' && !messages.content) {
            messages.content = `${messages.sender} joined the chat`;
          }
          this.messages = [...this.messages, messages];
        }
        this.scrollToBottom();
      },
      () => {
        this.chatService.addUser(this.username);
      }
    );
  }

  sendMessage() {
    if (this.messageContent.trim()) {
      this.cdr.detectChanges();
      this.chatService.sendMessage(this.messageContent, this.username);
      this.messageContent = '';
      this.scrollToBottom();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  handleTabClose() {
    this.chatService.leaveUser(this.username);
  }

  trackById(index: number, message: IChatMessage) {
    return message.id;
  }
}
