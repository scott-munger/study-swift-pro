import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { X, Send, MessageCircle, Mail, Minus } from 'lucide-react';
import { findResponse, getGreeting } from '@/lib/chatbotResponses';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import { API_URL } from '@/config/api';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const t = useTranslation();
  const { language } = useLanguage();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message de bienvenue initial
      const greeting = getGreeting();
      addMessage(greeting, true);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (text: string, isBot: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    addMessage(userMessage, false);
    setInput('');

    // Vérifier si c'est une question sur les chapitres/matières
    const lowerInput = userMessage.toLowerCase();
    const isSearchQuery = lowerInput.includes('chapitre') || 
                          lowerInput.includes('matière') || 
                          lowerInput.includes('matyè') ||
                          lowerInput.includes('recherche') ||
                          lowerInput.includes('cherche') ||
                          lowerInput.includes('liste') ||
                          lowerInput.includes('quelles matières') ||
                          lowerInput.includes('ki matyè') ||
                          lowerInput.includes('quels chapitres') ||
                          lowerInput.includes('ki chapit') ||
                          lowerInput.includes('dans') ||
                          lowerInput.match(/\b(math|français|anglais|physique|chimie|svt|histoire|géographie|philo|philosophie|espagnol|allemand)\b/i);

    if (isSearchQuery) {
      // Rechercher dans la base de données
      try {
        const response = await fetch(`${API_URL}/api/chatbot/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: userMessage }),
        });

        if (response.ok) {
          const data = await response.json();
          let searchResponse = '';

          if (data.subjects && data.subjects.length > 0) {
            searchResponse += '📚 **Matières trouvées :**\n';
            data.subjects.forEach((subject: any) => {
              searchResponse += `• ${subject.name} (${subject.level || 'Tous niveaux'})`;
              if (subject.section) searchResponse += ` - ${subject.section}`;
              searchResponse += '\n';
            });
            searchResponse += '\n';
          }

          if (data.chapters && data.chapters.length > 0) {
            searchResponse += '📖 **Chapitres trouvés :**\n';
            data.chapters.forEach((chapter: any) => {
              searchResponse += `• ${chapter.name}`;
              if (chapter.subject) {
                searchResponse += ` (${chapter.subject.name}`;
                if (chapter.subject.level) searchResponse += ` - ${chapter.subject.level}`;
                searchResponse += ')';
              }
              if (chapter.description) {
                searchResponse += `\n  ${chapter.description.substring(0, 100)}...`;
              }
              searchResponse += '\n';
            });
            searchResponse += '\n';
          }

          if (!searchResponse) {
            searchResponse = 'Aucun résultat trouvé pour votre recherche. Essayez avec d\'autres mots-clés ou demandez-moi la liste des matières disponibles.';
          } else {
            searchResponse += '\n💡 **Astuce :** Vous pouvez me demander "Quels sont les chapitres de [nom de la matière] ?" pour voir tous les chapitres d\'une matière.';
          }

          addMessage(searchResponse, true);
        } else {
          // Fallback vers les réponses pré-configurées
          setTimeout(() => {
            const response = findResponse(userMessage);
            addMessage(response, true);
          }, 500);
        }
      } catch (error) {
        console.error('Erreur recherche chatbot:', error);
        // Fallback vers les réponses pré-configurées
        setTimeout(() => {
          const response = findResponse(userMessage);
          addMessage(response, true);
        }, 500);
      }
    } else {
      // Vérifier si c'est une question "quels sont les chapitres de [matière]"
      const chapterMatch = userMessage.match(/quels?\s+(sont|sont-ils)\s+(les\s+)?chapitres?\s+(de|du|d'|dans)\s+(.+)/i) ||
                          userMessage.match(/ki\s+chapit\s+(yo\s+)?(nan|pou)\s+(.+)/i);
      
      if (chapterMatch) {
        const subjectName = chapterMatch[4] || chapterMatch[3];
        // Rechercher la matière d'abord
        try {
          const subjectResponse = await fetch(`${API_URL}/api/chatbot/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: subjectName }),
          });

          if (subjectResponse.ok) {
            const subjectData = await subjectResponse.json();
            if (subjectData.subjects && subjectData.subjects.length > 0) {
              const subject = subjectData.subjects[0];
              // Récupérer les chapitres de cette matière
              const chaptersResponse = await fetch(`${API_URL}/api/chatbot/chapters/${subject.id}`);
              if (chaptersResponse.ok) {
                const chaptersData = await chaptersResponse.json();
                let responseText = `📖 **Chapitres de ${chaptersData.subject.name} :**\n\n`;
                if (chaptersData.chapters && chaptersData.chapters.length > 0) {
                  chaptersData.chapters.forEach((chapter: any, index: number) => {
                    responseText += `${index + 1}. ${chapter.name}`;
                    if (chapter.description) {
                      responseText += `\n   ${chapter.description.substring(0, 80)}...`;
                    }
                    responseText += '\n\n';
                  });
                  responseText += `Total : ${chaptersData.chapters.length} chapitres`;
                } else {
                  responseText = `Aucun chapitre trouvé pour la matière "${chaptersData.subject.name}".`;
                }
                addMessage(responseText, true);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Erreur recherche chapitres:', error);
        }
      }
      
      // Utiliser les réponses pré-configurées
      setTimeout(() => {
        const response = findResponse(userMessage);
        addMessage(response, true);
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContactSupport = () => {
    setShowEmailForm(true);
    addMessage(
      "J'ai noté votre demande. Veuillez remplir le formulaire ci-dessous pour contacter notre équipe support.",
      true
    );
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      addMessage('Veuillez remplir tous les champs du formulaire (sujet et message).', true);
      return;
    }

    setEmailSending(true);
    
    try {
      const userEmail = user?.email || 'visiteur@example.com';
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Visiteur';
      
      console.log('📧 Envoi email support:', { userEmail, userName, subject: emailSubject });
      
      const response = await fetch(`${API_URL}/api/contact/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          subject: emailSubject,
          message: emailMessage,
          userName: userName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addMessage(
          '✅ Votre message a été envoyé avec succès à mail@tyala.online ! Notre équipe vous répondra dans les plus brefs délais. Vous recevrez la réponse à votre adresse email.',
          true
        );
        setEmailSubject('');
        setEmailMessage('');
        setShowEmailForm(false);
      } else {
        console.error('Erreur envoi email:', data);
        const errorMsg = language === 'fr' 
          ? `❌ Une erreur s'est produite lors de l'envoi : ${data.error || 'Erreur inconnue'}\n\nVous pouvez contacter directement mail@tyala.online`
          : `❌ Yon erè te fèt pandan w ap voye : ${data.error || 'Erè enkoni'}\n\nOu ka kontakte dirèkteman mail@tyala.online`;
        addMessage(errorMsg, true);
      }
    } catch (error) {
      console.error('Erreur envoi email support:', error);
      const connectionErrorMsg = language === 'fr'
        ? "❌ Erreur de connexion lors de l'envoi. Vous pouvez contacter directement mail@tyala.online par email."
        : "❌ Erè koneksyon pandan w ap voye. Ou ka kontakte dirèkteman mail@tyala.online pa imèl.";
      addMessage(connectionErrorMsg, true);
    } finally {
      setEmailSending(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const response = findResponse(action);
    addMessage(response, true);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="premium"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col shadow-2xl border-2">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">{t.chatbot.title}</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setIsMinimized(!isMinimized);
              if (!isMinimized) {
                setIsOpen(false);
              }
            }}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 border-b">
              <p className="text-xs text-muted-foreground mb-2">Questions fréquentes :</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction('inscription')}
                >
                  {t.nav.register}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction('connexion')}
                >
                  {t.nav.login}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction('mot de passe')}
                >
                  {t.auth.password}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction('fonctionnalités')}
                >
                  {t.common.info}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API_URL}/api/chatbot/subjects`);
                      if (response.ok) {
                        const data = await response.json();
                        let responseText = '📚 **Matières disponibles :**\n\n';
                        if (data.subjects && data.subjects.length > 0) {
                          const subjectsByLevel: Record<string, any[]> = {};
                          data.subjects.forEach((subject: any) => {
                            const level = subject.level || 'Tous niveaux';
                            if (!subjectsByLevel[level]) {
                              subjectsByLevel[level] = [];
                            }
                            subjectsByLevel[level].push(subject);
                          });
                          
                          Object.keys(subjectsByLevel).forEach(level => {
                            responseText += `**${level} :**\n`;
                            subjectsByLevel[level].forEach(subject => {
                              responseText += `• ${subject.name}`;
                              if (subject.section) responseText += ` (${subject.section})`;
                              if (subject._count) {
                                responseText += ` - ${subject._count.chapters || 0} chapitres`;
                              }
                              responseText += '\n';
                            });
                            responseText += '\n';
                          });
                        } else {
                          responseText = 'Aucune matière disponible pour le moment.';
                        }
                        addMessage(responseText, true);
                      } else {
                        handleQuickAction('liste des matières');
                      }
                    } catch (error) {
                      handleQuickAction('liste des matières');
                    }
                  }}
                >
                  Matières
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickAction('chapitres')}
                >
                  Chapitres
                </Button>
              </div>
            </div>
          )}

          {/* Email Form */}
          {showEmailForm && (
            <div className="p-4 border-t bg-muted/50 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">{t.chatbot.subject}</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={t.chatbot.subject}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{t.chatbot.message}</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder={t.chatbot.message}
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmailSubject('');
                    setEmailMessage('');
                  }}
                  className="flex-1"
                >
                  {t.actions.cancel}
                </Button>
                <Button
                  variant="premium"
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={emailSending}
                  className="flex-1"
                >
                  {emailSending ? t.actions.sending : t.actions.send}
                </Button>
              </div>
            </div>
          )}

          {/* Input */}
          {!showEmailForm && (
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                  <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.chatbot.placeholder}
                  className="text-sm"
                />
                <Button
                  variant="premium"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
                <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={handleContactSupport}
              >
                <Mail className="h-3 w-3 mr-2" />
                {t.chatbot.contactSupport}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

