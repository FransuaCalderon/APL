using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AppAPL.Dto.Router
{
    public class RouterRequest
    {
        public string Code_App { get; set; } = string.Empty;
        public string Http_Method { get; set; } = string.Empty;
        public string Endpoint_Path { get; set; } = string.Empty;
        public string Client { get; set; } = string.Empty;
        public string? Endpoint_Query_Params { get; set; }
        // Usamos JsonElement para que el body pueda ser cualquier objeto
        public JsonElement? Body_Request { get; set; } // El ? permite el null
    }

    public class RouterResponse
    {
        public string Status { get; set; } = "ok";
        public int Code_Status { get; set; } = 200;
        public object? Json_Response { get; set; }
        public string UniTransac { get; set; } = DateTime.Now.ToString("yyyyMMddHHmmssffff");
    }

    public class RouterExecuteRequest
    {
        public IFormFile? ArchivoSoporte { get; set; }
        public string? RouterRequestJson { get; set; }
    }
}
