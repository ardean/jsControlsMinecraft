export default interface Message {
    type: "info" | "warning" | "error";
    message: string;
}
