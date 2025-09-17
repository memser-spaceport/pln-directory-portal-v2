import React, { Fragment } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Tag } from '@/components/ui/tag';

interface TooltipProps {
  name: string;
  description: string;
  tags: string[];
  onOpenChange?: (open: boolean) => void;
}

const Tooltip: React.FC<TooltipProps> = ({ name, description, tags, onOpenChange }) => {
  return (
    <>
      <TooltipPrimitive.Provider delayDuration={0} disableHoverableContent={false}>
        <TooltipPrimitive.Root onOpenChange={onOpenChange}>
          <TooltipPrimitive.Trigger asChild>
            <span className="hoverable-name">{name}</span>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content side="top" align="center" className="asks__tooltip">
              <div className="asks__tooltip__cnt">
                <div className="asks__tooltip__cnt__name">{name}</div>
                <div
                  className="asks__tooltip__cnt__desc"
                  dangerouslySetInnerHTML={{ __html: description }}
                  onClick={(e) => {
                    const link = (e.target as Element).closest('a');
                    if (link) {
                      window.open(link.href, '_blank');
                    }
                  }}
                />
                <div className="asks__tooltip__cnt__tags">
                  {tags?.map((tag, index) => (
                    <Fragment key={`${tag} + ${index}`}>
                      {index < 2 && (
                        <div>
                          <Tag value={tag} variant="primary" tagsLength={tags.length} />
                        </div>
                      )}
                    </Fragment>
                  ))}
                  {tags?.length > 2 && <Tag variant="primary" value={`+${tags.length - 2}`} />}
                </div>
              </div>
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>

      <style jsx>{`
        .asks__tooltip__cnt {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .asks__tooltip__cnt__name {
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          text-align: left;
        }

        .asks__tooltip__cnt__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 22px;
          text-align: left;
          word-break: break-word;
        }

        .asks__tooltip__cnt__tags {
          display: flex;
          flex-direction: row;
          gap: 4px;
        }

        .hoverable-name:hover {
          text-decoration: underline;
          cursor: pointer;
        }
        .hoverable-name {
          display: flex;
        }

        .asks__tooltip__cnt {
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};

export default Tooltip;
