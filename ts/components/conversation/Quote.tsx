// tslint:disable:react-this-binding-issue

import React from 'react';
import classNames from 'classnames';

import * as MIME from '../../../ts/types/MIME';
import * as GoogleChrome from '../../../ts/util/GoogleChrome';

import { MessageBody } from './MessageBody';
import { Color, Localizer } from '../../types/Util';
import { ContactName } from './ContactName';

interface Props {
  attachment?: QuotedAttachment;
  authorPhoneNumber: string;
  authorProfileName?: string;
  authorName?: string;
  authorColor: Color;
  i18n: Localizer;
  isFromMe: boolean;
  isIncoming: boolean;
  withContentAbove: boolean;
  onClick?: () => void;
  onClose?: () => void;
  text: string;
}

export interface QuotedAttachment {
  contentType: MIME.MIMEType;
  fileName: string;
  /** Not included in protobuf */
  isVoiceMessage: boolean;
  thumbnail?: Attachment;
}

interface Attachment {
  contentType: MIME.MIMEType;
  /** Not included in protobuf, and is loaded asynchronously */
  objectUrl?: string;
}

function validateQuote(quote: Props): boolean {
  if (quote.text) {
    return true;
  }

  if (quote.attachment) {
    return true;
  }

  return false;
}

function getObjectUrl(thumbnail: Attachment | undefined): string | null {
  if (thumbnail && thumbnail.objectUrl) {
    return thumbnail.objectUrl;
  }

  return null;
}

function getTypeLabel({
  i18n,
  contentType,
  isVoiceMessage,
}: {
  i18n: Localizer;
  contentType: MIME.MIMEType;
  isVoiceMessage: boolean;
}): string | null {
  if (GoogleChrome.isVideoTypeSupported(contentType)) {
    return i18n('video');
  }
  if (GoogleChrome.isImageTypeSupported(contentType)) {
    return i18n('photo');
  }
  if (MIME.isAudio(contentType) && isVoiceMessage) {
    return i18n('voiceMessage');
  }
  if (MIME.isAudio(contentType)) {
    return i18n('audio');
  }

  return null;
}

export class Quote extends React.Component<Props> {
  public renderImage(url: string, i18n: Localizer, icon?: string) {
    const iconElement = icon ? (
      <div className="module-quote__icon-container__inner">
        <div className="module-quote__icon-container__circle-background">
          <div
            className={classNames(
              'module-quote__icon-container__icon',
              `module-quote__icon-container__icon--${icon}`
            )}
          />
        </div>
      </div>
    ) : null;

    return (
      <div className="module-quote__icon-container">
        <img src={url} alt={i18n('quoteThumbnailAlt')} />
        {iconElement}
      </div>
    );
  }

  public renderIcon(icon: string) {
    return (
      <div className="module-quote__icon-container">
        <div className="module-quote__icon-container__inner">
          <div className="module-quote__icon-container__circle-background">
            <div
              className={classNames(
                'module-quote__icon-container__icon',
                `module-quote__icon-container__icon--${icon}`
              )}
            />
          </div>
        </div>
      </div>
    );
  }

  public renderGenericFile() {
    const { attachment } = this.props;

    if (!attachment) {
      return;
    }

    const { fileName, contentType } = attachment;
    const isGenericFile =
      !GoogleChrome.isVideoTypeSupported(contentType) &&
      !GoogleChrome.isImageTypeSupported(contentType) &&
      !MIME.isAudio(contentType);

    if (!isGenericFile) {
      return null;
    }

    return (
      <div className="module-quote__generic-file">
        <div className="module-quote__generic-file__icon" />
        <div className="module-quote__generic-file__text">{fileName}</div>
      </div>
    );
  }

  public renderIconContainer() {
    const { attachment, i18n } = this.props;
    if (!attachment) {
      return null;
    }

    const { contentType, thumbnail } = attachment;
    const objectUrl = getObjectUrl(thumbnail);

    if (GoogleChrome.isVideoTypeSupported(contentType)) {
      return objectUrl
        ? this.renderImage(objectUrl, i18n, 'play')
        : this.renderIcon('movie');
    }
    if (GoogleChrome.isImageTypeSupported(contentType)) {
      return objectUrl
        ? this.renderImage(objectUrl, i18n)
        : this.renderIcon('image');
    }
    if (MIME.isAudio(contentType)) {
      return this.renderIcon('microphone');
    }

    return null;
  }

  public renderText() {
    const { i18n, text, attachment } = this.props;

    if (text) {
      return (
        <div dir="auto" className="module-quote__primary__text">
          <MessageBody text={text} i18n={i18n} />
        </div>
      );
    }

    if (!attachment) {
      return null;
    }

    const { contentType, isVoiceMessage } = attachment;

    const typeLabel = getTypeLabel({ i18n, contentType, isVoiceMessage });
    if (typeLabel) {
      return (
        <div className="module-quote__primary__type-label">{typeLabel}</div>
      );
    }

    return null;
  }

  public renderClose() {
    const { onClose } = this.props;

    if (!onClose) {
      return null;
    }

    // We don't want the overall click handler for the quote to fire, so we stop
    //   propagation before handing control to the caller's callback.
    const onClick = (e: React.MouseEvent<{}>): void => {
      e.stopPropagation();
      onClose();
    };

    // We need the container to give us the flexibility to implement the iOS design.
    return (
      <div className="module-quote__close-container">
        <div
          className="module-quote__close-button"
          role="button"
          onClick={onClick}
        />
      </div>
    );
  }

  public renderAuthor() {
    const {
      authorProfileName,
      authorPhoneNumber,
      authorName,
      authorColor,
      i18n,
      isFromMe,
    } = this.props;

    return (
      <div
        className={classNames(
          'module-quote__primary__author',
          !isFromMe ? `module-quote__primary__author--${authorColor}` : null
        )}
      >
        {isFromMe ? (
          i18n('you')
        ) : (
          <ContactName
            phoneNumber={authorPhoneNumber}
            name={authorName}
            profileName={authorProfileName}
            i18n={i18n}
          />
        )}
      </div>
    );
  }

  public render() {
    const {
      authorColor,
      isFromMe,
      isIncoming,
      onClick,
      withContentAbove,
    } = this.props;

    if (!validateQuote(this.props)) {
      return null;
    }

    return (
      <div
        onClick={onClick}
        role="button"
        className={classNames(
          'module-quote',
          isIncoming ? 'module-quote--incoming' : 'module-quote--outgoing',
          !isIncoming && !isFromMe
            ? `module-quote--outgoing-${authorColor}`
            : null,
          !isIncoming && isFromMe ? 'module-quote--outgoing-you' : null,
          !onClick ? 'module-quote--no-click' : null,
          withContentAbove ? 'module-quote--with-content-above' : null
        )}
      >
        <div className="module-quote__primary">
          {this.renderAuthor()}
          {this.renderGenericFile()}
          {this.renderText()}
        </div>
        {this.renderIconContainer()}
        {this.renderClose()}
      </div>
    );
  }
}
