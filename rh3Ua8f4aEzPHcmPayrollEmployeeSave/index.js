
/**
 * Nome da primitiva : employeeSave
 * Nome do dominio : hcm
 * Nome do serviço : payroll
 * Nome do tenant : trn18061116
 **/

const axios = require("axios");

exports.handler = async event => {
  
  let body = parseBody(event);
  let tokenSeniorX = event.headers['X-Senior-Token'];
  
  
  const instance = axios.create ({
    baseURL: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest/',
    headers: {
      'Authorization': tokenSeniorX
     }
  });  
  
  //10 caracteres
  if(body.sheetPersona.nickname){
      if(body.sheetPersona.nickname.length > 10){
    return sendRes(400, 'o apelido deve ter no maximo 10 caracteres!');
    }
  } else {
     return sendRes(400, 'o apelido deve ser informado!');
  }
  
  //foto
  if(!body.sheetPersona.attachment){
  return sendRes(400, 'a foto do colaborador deve ser informada!');
  }
  
  //Não permitir alterar o CPF do colaborador
  if (body.sheetInitial.employee){
    let employee = await instance.get(`/hcm/payroll/entities/employee/${body.sheetInitial.employee.tableId}`);
    
    if (employee.data.person.cpf !== body.sheetDocument.cpfNumber){
      return sendRes(400, 'Não é permitido alterar o CPF do colaborador!');  
    }
  }
  
  /*Valida Campo customizado em conjunto com campo nativo*/
if((body.sheetContract.customFieldsEmployee) && (body.sheetComplement.issueDotCard)) {

  let customFields = body.sheetContract.customFieldsEmployee;
  let issueDotCard = body.sheetComplement.issueDotCard;

  //Percorre o array de campos customizados
  for (let customField of customFields) {
   if (customField.field === 'USU_CARCON') {
     if ((customField.value === 'S') && (issueDotCard.key === 'Yes')) {
       return sendRes(400, 'Colaboradores com Cargo de confiança não devem emitir cartão Ponto!');
     }
    }
  }
}

//validação do campo preenche quota
if ((body.sheetPersona.isDisability === "true") && (body.sheetPersona.isOccupantQuota === "false")){
  return sendRes(400, 'Quando o colaborador for deficiente, o campo Preenche Cota deve ser informado com Sim!');
}

  //caso todas as validações passem
  return sendRes(200, body);
};
 
const parseBody = (event) => {
  return typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
};
 
const sendRes = (status,body) => {
  var response = {
    statusCode:status,
    headers: {
      "Content-Type":"application/json"
    },
    body:typeof body ==='string' ? body : JSON.stringify(body)
  };
  return response;
};