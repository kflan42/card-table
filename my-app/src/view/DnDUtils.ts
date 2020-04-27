// item types for react dnd
export const ItemTypes = {
    CARD: "card",
    BFCARD: "bfcard",
    COUNTER: "counter"
};

export interface DragCard {
    type: string;
    bfId?: number;
    cardId: number;
    srcZone: string;
    srcOwner: string;
}
